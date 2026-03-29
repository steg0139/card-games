import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CardScoreTrackerStack } from '../lib/stack'

const app = new cdk.App()

new CardScoreTrackerStack(app, 'CardScoreTrackerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1'
  }
})
