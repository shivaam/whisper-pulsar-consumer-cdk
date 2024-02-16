#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWhisperStack } from '../lib/cdk-whisper-stack';

const app = new cdk.App();
new CdkWhisperStack(app, 'CdkWhisperStack');
