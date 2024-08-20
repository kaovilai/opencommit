import axios, { AxiosInstance } from 'axios';
import { OpenAI } from 'openai';
import { AiEngine, AiEngineConfig } from './Engine';

interface FlowiseAiConfig extends AiEngineConfig {}

export class FlowiseAi implements AiEngine {
  config: FlowiseAiConfig;
  client: AxiosInstance;

  constructor(config) {
    this.config = config;
    this.client = axios.create({
      // TODO: verify. basePath should be equal to OCO_FLOWISE_ENDPOINT
      url: `/api/v1/prediction/${config.apiKey}`,
      baseURL: `http://${config.basePath}`, // TODO: refactor to baseURL: this.config.basePath
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async generateCommitMessage(
    messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam>
  ): Promise<string | undefined> {
    const gitDiff = (messages[messages.length - 1]?.content as string)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    const payload = {
      question: gitDiff,
      overrideConfig: {
        systemMessagePrompt: messages[0]?.content
      },
      history: messages.slice(1, -1)
    };
    try {
      const response = await this.client.post('', payload);
      const message = response.data;
      return message?.text;
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message;
      throw new Error('local model issues. details: ' + message);
    }
  }
}