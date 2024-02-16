import { EMITTER, INTERNAL_EVENTS } from '../events/EventsHandler.js';
import { InternalRequest, RequestExecuter } from '../providers/backend/InternalRequest.js';
import { ConnectionConfig, WebHookInfo } from './backend/Connection.js';
import { STATUS, Server } from './backend/Server.js';
import http from 'http';

export class POGHandler extends Server implements RequestExecuter {
	private config: ConnectionConfig;
	private host: string;
	private port: number;

	constructor(config: ConnectionConfig) {
		super(config.id);
		this.config = config;

		const { host, port } = config.info as WebHookInfo;
		this.host = host;
		this.port = port;

		this.on(INTERNAL_EVENTS.EXECUTE_ACTION, (payload) => {
			const __request: InternalRequest = payload.data;

			if (__request.providerId === this.config.id) {
				this.executeRequest(__request);
			}
		});
	}

	async sendTTSRequest(
		message: string,
		username: string,
		voice: string = 'brian',
		service: string = 'monster',
		limit: number = 350
	): Promise<any> {
		const url = `http://${this.host}:${this.port}/pog?text=${message}&user=${username}&tts=${service}&limit=${limit}&tts=${voice}`;

		try {
			const data = await this.sendHttpRequest(url);
			return data;
		} catch (error) {
			throw error;
		}
	}

	executeRequest(request: InternalRequest): void {
		const { context } = request;

		const { username, voice = 'brian', service = 'monster', limit = '350', message = '' } = context;
		const __message: string = message.replace(/^!\w+\s/, '');

		this.sendTTSRequest(__message, username, voice, service, limit)
			.then((_) => {
				EMITTER.emit(INTERNAL_EVENTS.INFO, {
					data: { message: `Action 'TTS' executed by '${username}' with message '${__message}'` }
				});
			})
			.catch((error) => {
				EMITTER.emit(INTERNAL_EVENTS.ERROR, {
					data: { message: `Error occurred trying to execute TTS action by '${username}'` }
				});
				console.error(error);
			});
	}

	start(): void {}
	stop(): void {}

	async status(): Promise<STATUS> {
		if (!this.config.enabled) {
			console.log('POGHandler: status: OFFLINE');
			return STATUS.OFFLINE;
		}

		const url = `http://localhost:3800/status`;

		try {
			const data = await this.sendHttpRequest(url);
			return data === '1' ? STATUS.ONLINE : STATUS.UNAVAILABLE;
		} catch (error) {
			console.log(error);
			return STATUS.OFFLINE;
		}
	}

	private sendHttpRequest(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			http
				.get(url, (res) => {
					let data = '';

					res.on('data', (chunk) => {
						data += chunk;
					});

					res.on('end', () => {
						resolve(data);
					});
				})
				.on('error', (error) => {
					reject(error);
				});
		});
	}
}