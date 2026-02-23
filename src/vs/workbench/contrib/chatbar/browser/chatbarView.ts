import { $, append } from '../../../../base/browser/dom.js';
import { InputBox } from '../../../../base/browser/ui/inputbox/inputBox.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IContextViewService } from '../../../../platform/contextview/browser/contextView.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { ViewPane, IViewPaneOptions } from '../../../browser/parts/views/viewPane.js';
import { ChatMarkdownRenderer } from '../../chat/browser/chatMarkdownRenderer.js';
import { localize } from '../../../../nls.js';
import { getInputBoxStyle } from '../../../../platform/theme/browser/defaultStyles.js';
import { inputBackground, inputForeground, inputBorder } from '../../../../platform/theme/common/colorRegistry.js';
import './media/chatbar.css';

export class ChatbarViewPane extends ViewPane {
	static readonly ID = 'workbench.view.chatbar.view';

	private messages!: HTMLElement;
	private input!: InputBox;
	private renderer: ChatMarkdownRenderer;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IContextViewService private readonly contextViewService: IContextViewService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);

		this.renderer = instantiationService.createInstance(ChatMarkdownRenderer, {});
	}

	protected override renderBody(container: HTMLElement): void {
		const root = append(container, $('.chatbar-root'));
		const messages = append(root, $('.chatbar-messages'));
		this.messages = messages;
		const inputArea = append(root, $('.chatbar-input'));
		this.input = new InputBox(inputArea, this.contextViewService, {
			ariaLabel: localize('chatbarInput', 'Chat input'),
			inputBoxStyles: getInputBoxStyle({
				inputBackground,
				inputForeground,
				inputBorder
			})
		});
		this._register(this.themeService.onDidColorThemeChange(() => (this.input as any).applyStyles()));
		const button = append(inputArea, $('button.chatbar-send', undefined, localize('chatbarSend', 'Send')));
		button.addEventListener('click', () => this.submit());
		this.input.inputElement.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.submit();
			}
		});
	}

	private async submit(): Promise<void> {
		const value = this.input.value.trim();
		if (!value) {
			return;
		}

		this.addMessage(value, 'user');
		this.input.value = '';

		const start = Date.now();
		try {
			const response = await this.fakeApi(value);
			const latency = Date.now() - start;
			this.addMarkdownMessage(response, latency);
		} catch (err) {
			this.addMessage(localize('chatbarError', 'Error: {0}', (err as Error).message ?? String(err)), 'error');
		}

		this.messages.scrollTop = this.messages.scrollHeight;
	}

	private addMessage(text: string, cls: string): void {
		append(this.messages, $('.chatbar-message.' + cls, undefined, text));
	}

	private addMarkdownMessage(md: string, latency: number): void {
		const container = append(this.messages, $('.chatbar-message.response'));
		const rendered = this.renderer.render({ value: md });
		container.appendChild(rendered.element);
		append(container, $('.chatbar-latency', undefined, localize('chatbarLatency', 'Latency: {0}ms', latency)));
	}

	private async fakeApi(prompt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const delay = 500 + Math.floor(Math.random() * 500);
			setTimeout(() => {
				const lowerPrompt = prompt.toLowerCase();
				if (/error/i.test(prompt)) {
					reject(new Error('Simulated error'));
				} else if (lowerPrompt.includes('project') || lowerPrompt.includes('file')) {
					resolve(`**Coldwar Context**: Scanning project files...\n\nFound 3 files:\n- \`src/index.ts\`\n- \`package.json\`\n- \`README.md\`\n\nI can help you edit these files.`);
				} else if (lowerPrompt.includes('terminal') || lowerPrompt.includes('run')) {
					resolve(`**Coldwar Terminal**: Executing command...\n\n\`\`\`bash\n$ npm run build\n> coldwar-dev@1.0.0 build\n> tsc\n\`\`\`\n\nBuild completed successfully.`);
				} else if (lowerPrompt.includes('create')) {
					resolve(`**Coldwar**: I can create that project for you. \n\nInitializing new project structure... Done.`);
				} else {
					resolve(`You said: **${prompt}**\n\nI am the Coldwar AI. \n\n\`\`\`ts\nconsole.log('Coldwar');\n\`\`\``);
				}
			}, delay);
		});
	}
}
