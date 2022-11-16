import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, aws_s3 as s3, aws_iam as iam, aws_ec2 as ec2, Duration, aws_lambda as lambda, aws_s3objectlambda as object_lambda, Aws, CfnOutput } from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class EcsalbStack extends cdk.Stack {

  public static readonly appName: string = "bvsfe";
  
  private readonly vectorTileBucketAccessPointName = "vector-tile-bucket-access-point"
  private readonly vectorTileObjectLambdaAccessPointName = "vector-tile-object-lambda-access-point"
  private readonly vectorTileAccessPointName = `arn:aws:s3:${Aws.REGION}:${Aws.ACCOUNT_ID}:accesspoint/${this.vectorTileBucketAccessPointName}`

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

    new s3.Bucket(this, "publicData", {
      bucketName: "spk-sar-bc-public-data",
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: true
    })

    const fgbData = new s3.Bucket(this, "fgbData", {
      bucketName: "fgb-data",
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    })

    const vectorTileBucket = new s3.Bucket(this, "mbtData", {
      bucketName: "mbt-data",
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

    const vectorTileObjectLambda = new lambda.Function(this, "vectorTileObjectLambda", {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "..", "..", "vector_tile_reader"))
    })
    vectorTileObjectLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: ["s3-object-lambda:WriteGetObjectResponse"]
    }))
    if (!vectorTileObjectLambda.role) {
      throw Error("Something is wrong here")
    }
    const vectorTileBucketAccessPoint = new s3.CfnAccessPoint(this, "vectorTileBucketAccessPoint", {
      bucket: vectorTileBucket.bucketName,
      name: this.vectorTileBucketAccessPointName,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:GetObject"],
            principals: [
              new iam.ArnPrincipal(vectorTileObjectLambda.role?.roleArn)
            ],
            resources: [
              `${this.vectorTileAccessPointName}/object/*`
            ],
            sid: "AllowLambdaToUseAccessPoint"
          })
        ]
      })
    })
    new object_lambda.CfnAccessPoint(this, "vectorTileObjectLambdaAccessPoint", {
      name: this.vectorTileObjectLambdaAccessPointName,
      objectLambdaConfiguration: {
        supportingAccessPoint: this.vectorTileAccessPointName,
        transformationConfigurations: [{
          actions: ["GetObject"],
          contentTransformation: {
            AwsLambda: {
              FunctionArn: vectorTileObjectLambda.functionArn
            }
          }
        }]
      }
    })

    new CfnOutput(this, "objectLambdaAccessPointUrl", {
      value: `https://console.aws.amazon.com/s3/olap/${Aws.ACCOUNT_ID}/${this.vectorTileObjectLambdaAccessPointName}?region=${Aws.REGION}`
    })
  }
}
