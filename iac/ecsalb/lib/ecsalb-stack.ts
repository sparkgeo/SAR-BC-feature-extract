import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, aws_s3 as s3, aws_iam as iam, aws_ec2 as ec2, Duration } from 'aws-cdk-lib';
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

    // new s3.Bucket(this, "publicTileData", {
    //   bucketName: "public-tile-data",
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   publicReadAccess: true
    // })

    const fgbData = new s3.Bucket(this, "fgbData", {
      bucketName: "fgb-data",
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
  }
}
