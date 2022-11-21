import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { SecretValue } from 'aws-cdk-lib';

const targetDomain = 'npcdktest.learn.genesis.global'

export class AmplifyDocsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyApp = new amplify.App(this, 'NpTestCdkAmplify', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'makeusabrew',
        repository: 'ptest',
        oauthToken: SecretValue.secretsManager('np-gh-pat')
      }),
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: '1.0',
        frontend: {
          phases: {
            preBuild: {
              commands: [
                'npm install',
              ],
            },
            build: {
              commands: [
                'npm run build',
              ],
            },
          },
          artifacts: {
            baseDirectory: 'build',
            files: ['**/*'],
          },
        },
      })
    });

    const mainBranch = amplifyApp.addBranch('main')
    const archiveBranch = amplifyApp.addBranch('archive')

    const domain = amplifyApp.addDomain(targetDomain, {
      enableAutoSubdomain: false
    })

    domain.mapRoot(mainBranch)
    domain.mapSubDomain(archiveBranch)

    amplifyApp.addCustomRule({
      source: '/archive/<*>',
      target: `https://archive.${targetDomain}/<*>`,
      status: amplify.RedirectStatus.TEMPORARY_REDIRECT
    })
    amplifyApp.addCustomRule({
      source: '/docs/<*>',
      target: '/<*>',
      status: amplify.RedirectStatus.REWRITE
    })
    amplifyApp.addCustomRule({
      source: '/',
      target: '/docs',
      status: amplify.RedirectStatus.TEMPORARY_REDIRECT
    })
    amplifyApp.addCustomRule({
      source: '/<*>',
      target: '/404.html',
      status: amplify.RedirectStatus.NOT_FOUND_REWRITE
    })

    // kick off builds for main and archive?
  }
}
