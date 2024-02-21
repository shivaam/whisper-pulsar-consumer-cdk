#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWhisperStack } from '../lib/cdk-whisper-stack';
import {PipelineStack} from "../lib/stack/pipeline";
import { BabbleboxAppPipeline } from '../lib/stack/babblebox-app-pipeline';

const app = new cdk.App();
//new PipelineStack(app, 'Whisper');
new BabbleboxAppPipeline(app, 'BabbleboxAppPipeline');
new PipelineStack(app, 'WhisperPulsarConsumerCdkPipeline');
