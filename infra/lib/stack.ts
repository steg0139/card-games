import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import * as path from 'path'

export class CardScoreTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB Tables ──
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'card-tracker-users',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    usersTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING }
    })

    const gamesTable = new dynamodb.Table(this, 'GamesTable', {
      tableName: 'card-tracker-games',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    gamesTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startedAt', type: dynamodb.AttributeType.NUMBER }
    })

    // ── Lambda function ──
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server'), {
        bundling: {
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          local: {
            tryBundle(outputDir: string) {
              const { execSync } = require('child_process')
              try {
                execSync(`cd ${path.join(__dirname, '../../server')} && npm install`, { stdio: 'inherit' })
                execSync(`cd ${path.join(__dirname, '../../server')} && npx tsc --outDir ${outputDir} --module commonjs --moduleResolution node`, { stdio: 'inherit' })
                execSync(`cp -r ${path.join(__dirname, '../../server')}/node_modules ${outputDir}/node_modules`)
                return true
              } catch (e) { console.error(e); return false }
            }
          }
        }
      }),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        USERS_TABLE: usersTable.tableName,
        GAMES_TABLE: gamesTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? '',
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? '',
        VAPID_EMAIL: process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256
    })

    usersTable.grantReadWriteData(apiLambda)
    gamesTable.grantReadWriteData(apiLambda)

    // ── API Gateway ──
    const api = new apigw.LambdaRestApi(this, 'ApiGateway', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS
      }
    })

    // ── S3 bucket for client ──
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })

    // ── CloudFront distribution ──
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
            originPath: `/${api.deploymentStage.stageName}`
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        }
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }
      ]
    })

    // ── Deploy client build to S3 ──
    new s3deploy.BucketDeployment(this, 'DeployClient', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../client/dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*']
    })

    // ── Outputs ──
    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'App URL'
    })
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API URL'
    })
  }
}
