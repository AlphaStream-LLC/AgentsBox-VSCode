import { localize } from '../../../../nls.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IViewContainersRegistry, IViewsRegistry, Extensions as ViewContainerExtensions, ViewContainerLocation, ViewContainer } from '../../../common/views.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { ChatbarViewPane } from './chatbarView.js';

export const CHATBAR_VIEW_CONTAINER_ID = 'workbench.view.chatbar';

const viewContainer: ViewContainer = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer({
	id: CHATBAR_VIEW_CONTAINER_ID,
	title: localize('chatbar', "Chatbar"),
	icon: Codicon.commentDiscussion,
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [CHATBAR_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
	order: 0,
}, ViewContainerLocation.AuxiliaryBar);

Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry).registerViews([
	{
		id: ChatbarViewPane.ID,
		name: localize('chatbarView', "Chatbar"),
		ctorDescriptor: new SyncDescriptor(ChatbarViewPane),
		canMoveView: true,
		canToggleVisibility: true,
	}
], viewContainer);
