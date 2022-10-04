import * as cdk from 'aws-cdk-lib';
import {
  RemovalPolicy,
  aws_s3 as s3,
  aws_iam as iam,
  aws_ec2 as ec2,
  Duration,
  aws_s3_deployment as s3_deploy,
  aws_ssm as ssm,
  FileSystem,
  DockerImage
} from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class EcsalbStack extends cdk.Stack {

  public static readonly appName: string = "bvsfe";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "vpc", {
      maxAzs: 2,
      subnetConfiguration: [{
        name: "frontend",
        subnetType: SubnetType.PUBLIC
      }]
    })

    const cluster = new Cluster(this, "cluster", {
      vpc: vpc,
      containerInsights: true
    });

    const fgbData = new s3.Bucket(this, "fgbData", {
      bucketName: "sar-fgb-data",
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    })

    const vpcEndpoint = vpc.addGatewayEndpoint("S3Endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3
    })

    fgbData.addToResourcePolicy(new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [fgbData.arnForObjects("*")],
      conditions: {"StringEquals": {"aws:SourceVpce": [vpcEndpoint.vpcEndpointId]}},
      principals: [new iam.AnyPrincipal()]
    }))

    const credsHashContextKey = "creds_hash"
    const credsHash = this.node.tryGetContext(credsHashContextKey)
    if (credsHash === undefined) {
      throw Error(`${credsHashContextKey} is a required context parameter`)
    }

    const fargate = new ApplicationLoadBalancedFargateService(this, "ALBFargateSvc", {
      cluster: cluster,
      cpu: 1024,
      memoryLimitMiB: 2048,
      assignPublicIp: true,
      desiredCount: 1,
      idleTimeout: Duration.minutes(5),
      taskImageOptions: {
        image: ContainerImage.fromAsset(path.join(__dirname, "..", "..", ".."), {
          "file": path.join("feature_extract_api", "Dockerfile")
        }),
        containerPort: 80,
        logDriver: LogDriver.awsLogs({
          streamPrefix: EcsalbStack.appName,
          logGroup: new LogGroup(this, "apiLogs", {
            logGroupName: "apiLogGroup",
            removalPolicy: RemovalPolicy.DESTROY
          })
        }),
        enableLogging: true,
        environment: {
          "data_access_prefix": `/vsis3/${fgbData.bucketName}`,
          "creds_hash": credsHash
        }
      },
      taskSubnets: {
        subnetType: SubnetType.PUBLIC
      }
    })

    fargate.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    }).scaleOnCpuUtilization("apiCpuScaler", {
      targetUtilizationPercent: 75
    })

    // const albDns = new ssm.StringParameter(this, 'albDns', {
    //   stringValue: fargate.loadBalancer.loadBalancerDnsName,
    // });

    const uiBucket = new s3.Bucket(this, "uiData", {
      bucketName: "sar-ui",
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })

    const buildCommand = "npx vite build && mv ./dist/* /asset-output/"
    const buildEnvironment = {
      VITE_CONTACT_NAME: process.env.VITE_CONTACT_NAME as string,
      VITE_SAR_ORG_NAME: process.env.VITE_SAR_ORG_NAME as string,
      VITE_MAPBOX_GL_MAP: process.env.VITE_MAPBOX_GL_MAP as string,
      // awaiting better solution
      VITE_API_BASE: "http://ecsal-albfa-sxthry0orzlw-321779260.us-west-2.elb.amazonaws.com/",
      VITE_MAP_INIT_CENTER: process.env.VITE_MAP_INIT_CENTER as string,
      VITE_MAP_INIT_ZOOM: process.env.VITE_MAP_INIT_ZOOM as string
    }
    new s3_deploy.BucketDeployment(this, "uiDeployment", {
      sources: [
        s3_deploy.Source.asset(path.join(__dirname, "..", "..", "..", "ui"), {
          assetHash: FileSystem.fingerprint(path.join(__dirname, "..", "..", "..", "ui"), {
            exclude: [
              "node_modules"
            ],
            extraHash: `${buildCommand}:${JSON.stringify(buildEnvironment)}`
          }),
          bundling: {
            image: DockerImage.fromBuild(path.join(__dirname, "..", "..", ".."), {
              file: path.join("ui", "Dockerfile")
            }),
            command: ["/bin/sh", "-c", buildCommand],
            environment: buildEnvironment,
            workingDirectory: "/asset-input"
          }
        })
      ],
      destinationBucket: uiBucket,
    })
  }
}
