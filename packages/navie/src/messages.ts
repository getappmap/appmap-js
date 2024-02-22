// import Message from './message';
// import InteractionHistory, { PromptInteractionEvent } from './interaction-history';
// import { ContextItem } from './interaction-state';

// export default class Messages {
//   messages: Message[] = [];
//   messagesLength = 0;

//   constructor(public readonly interactionHistory: InteractionHistory) {}

//   addSystemPrompt(prompt: string) {
//     this.interactionHistory.addEvent(new PromptInteractionEvent('systemPrompt', false, prompt));
//     this.messagesLength += prompt.length;
//     this.messages.push({
//       content: prompt,
//       role: 'system',
//     });
//   }

//   addQuestion(label: string, question: string) {
//     this.interactionHistory.addEvent(new PromptInteractionEvent('question', true, question));
//     const content = `${label}${question}`;
//     this.messagesLength += content.length;
//     this.messages.push({
//       content,
//       role: 'user',
//     });
//   }

//   addCodeSelection(label: string, codeSelection?: string) {
//     if (!codeSelection) return;

//     this.interactionHistory.addEvent(
//       new PromptInteractionEvent('codeSelection', true, codeSelection)
//     );
//     const content = `${label}${codeSelection}`;
//     this.messagesLength += content.length;
//     this.messages.push({
//       content,
//       role: 'user',
//     });
//   }

//   addContextItem(contextItem: ContextItem) {
//     this.messagesLength += contextItem.content.length;
//     this.interactionHistory.addEvent(
//       new PromptInteractionEvent('contextItem', true, contextItem.content)
//     );
//     this.messages.push({ content: contextItem.content, role: 'user' });
//   }
// }
