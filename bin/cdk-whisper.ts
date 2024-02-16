#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWhisperStack } from '../lib/cdk-whisper-stack';
import {PipelineStack} from "../lib/pipeline";

const app = new cdk.App();
new PipelineStack(app, 'Whisper');

