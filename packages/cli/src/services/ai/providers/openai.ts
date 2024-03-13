import { ChatOpenAI } from '@langchain/openai';
import type { BaseMessageChunk, BaseMessageLike } from '@langchain/core/messages';
import type { N8nAIProvider } from '@/types/ai.types';
import type { BaseChatModelCallOptions } from '@langchain/core/language_models/chat_models';

export class AIProviderOpenAI implements N8nAIProvider {
	private model: ChatOpenAI;

	constructor(options: { apiKey: string }) {
		this.model = new ChatOpenAI({
			openAIApiKey: options.apiKey,
			modelName: 'gpt-3.5-turbo-16k',
			timeout: 60000,
			maxRetries: 2,
			temperature: 0.2,
		});
	}

	mapResponse(data: BaseMessageChunk): string {
		if (Array.isArray(data.content)) {
			return data.content
				.map((message) =>
					'text' in message ? message.text : 'image_url' in message ? message.image_url : '',
				)
				.join('\n');
		}

		return data.content;
	}

	async prompt(messages: BaseMessageLike[], options?: BaseChatModelCallOptions) {
		const data = await this.model.invoke(messages, options);

		return this.mapResponse(data);
	}
}
