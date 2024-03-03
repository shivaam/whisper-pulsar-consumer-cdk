#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {PipelineStack} from "./stack/pipeline";
import { BabbleboxAppPipeline } from './stack/babblebox-app-pipeline';

const app = new cdk.App();
//new PipelineStack(app, 'Whisper');
new BabbleboxAppPipeline(app, 'BabbleboxAppPipeline');
//new PipelineStack(app, 'WhisperPulsarConsumerCdkPipeline');
