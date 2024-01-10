import VThumbIcon from '@/assets/thumb.svg';
import { __VLS_internalComponent, __VLS_componentsOption, __VLS_name } from './UserMessage.vue';

function __VLS_template() {
  let __VLS_ctx!: InstanceType<__VLS_PickNotAny<typeof __VLS_internalComponent, new () => {}>> & {};
  /* Components */
  let __VLS_otherComponents!: NonNullable<
    typeof __VLS_internalComponent extends { components: infer C } ? C : {}
  > &
    typeof __VLS_componentsOption;
  let __VLS_own!: __VLS_SelfComponent<
    typeof __VLS_name,
    typeof __VLS_internalComponent & (new () => { $scopedSlots: typeof __VLS_slots })
  >;
  let __VLS_localComponents!: typeof __VLS_otherComponents &
    Omit<typeof __VLS_own, keyof typeof __VLS_otherComponents>;
  let __VLS_components!: typeof __VLS_localComponents & __VLS_GlobalComponents & typeof __VLS_ctx;
  /* Style Scoped */
  type __VLS_StyleScopedClasses = {} & { message?: boolean } & { 'message-body'?: boolean } & {
    avatar?: boolean;
  } & { name?: boolean } & { 'message-body'?: boolean } & { buttons?: boolean } & {
    button?: boolean;
  } & { buttons?: boolean } & { button?: boolean } & { buttons?: boolean } & {
    button?: boolean;
  } & { sentiment?: boolean };
  let __VLS_styleScopedClasses!:
    | __VLS_StyleScopedClasses
    | keyof __VLS_StyleScopedClasses
    | (keyof __VLS_StyleScopedClasses)[];
  /* CSS variable injection */
  /* CSS variable injection end */
  let __VLS_resolvedLocalAndGlobalComponents!: {} & __VLS_WithComponent<
    'VComponent',
    typeof __VLS_localComponents,
    'VComponent',
    'vComponent',
    'v-component'
  > &
    __VLS_WithComponent<
      'VThumbIcon',
      typeof __VLS_localComponents,
      'VThumbIcon',
      'vThumbIcon',
      'v-thumb-icon'
    >;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_intrinsicElements.div;
  __VLS_components.VComponent;
  __VLS_components.vComponent;
  __VLS_components['v-component'];
  // @ts-ignore
  [VComponent];
  __VLS_intrinsicElements.span;
  __VLS_intrinsicElements.span;
  __VLS_intrinsicElements.span;
  __VLS_intrinsicElements.span;
  __VLS_components.VThumbIcon;
  __VLS_components.VThumbIcon;
  __VLS_components.vThumbIcon;
  __VLS_components.vThumbIcon;
  __VLS_components['v-thumb-icon'];
  __VLS_components['v-thumb-icon'];
  // @ts-ignore
  [VThumbIcon, VThumbIcon];
  {
    const __VLS_0 = __VLS_intrinsicElements['div'];
    const __VLS_1 = __VLS_elementAsFunctionalComponent(__VLS_0);
    const __VLS_2 = __VLS_1(
      {
        ...{},
        class: 'message',
        'data-cy': 'message',
        'data-actor': __VLS_ctx.isUser ? 'user' : 'system',
        'data-error': __VLS_ctx.isError,
      },
      ...__VLS_functionalComponentArgsRest(__VLS_1)
    );
    ((
      {} as (
        props: __VLS_FunctionalComponentProps<typeof __VLS_0, typeof __VLS_2> &
          Record<string, unknown>
      ) => void
    )({
      ...{},
      class: 'message',
      'data-cy': 'message',
      'data-actor': __VLS_ctx.isUser ? 'user' : 'system',
      'data-error': __VLS_ctx.isError,
    }));
    const __VLS_3 = __VLS_pickFunctionalComponentCtx(__VLS_0, __VLS_2)!;
    let __VLS_4!: __VLS_NormalizeEmits<typeof __VLS_3.emit>;
    {
      const __VLS_5 = __VLS_intrinsicElements['div'];
      const __VLS_6 = __VLS_elementAsFunctionalComponent(__VLS_5);
      const __VLS_7 = __VLS_6(
        { ...{}, class: 'avatar' },
        ...__VLS_functionalComponentArgsRest(__VLS_6)
      );
      ((
        {} as (
          props: __VLS_FunctionalComponentProps<typeof __VLS_5, typeof __VLS_7> &
            Record<string, unknown>
        ) => void
      )({ ...{}, class: 'avatar' }));
      const __VLS_8 = __VLS_pickFunctionalComponentCtx(__VLS_5, __VLS_7)!;
      let __VLS_9!: __VLS_NormalizeEmits<typeof __VLS_8.emit>;
      {
        const __VLS_10 = (
          {} as 'VComponent' extends keyof typeof __VLS_ctx
            ? { VComponent: typeof __VLS_ctx.VComponent }
            : 'vComponent' extends keyof typeof __VLS_ctx
            ? { VComponent: typeof __VLS_ctx.vComponent }
            : 'v-component' extends keyof typeof __VLS_ctx
            ? { VComponent: typeof __VLS_ctx['v-component'] }
            : typeof __VLS_resolvedLocalAndGlobalComponents
        ).VComponent;
        const __VLS_11 = __VLS_asFunctionalComponent(
          __VLS_10,
          new __VLS_10({ ...{}, is: __VLS_ctx.avatar })
        );
        (({} as { VComponent: typeof __VLS_10 }).VComponent);
        const __VLS_12 = __VLS_11(
          { ...{}, is: __VLS_ctx.avatar },
          ...__VLS_functionalComponentArgsRest(__VLS_11)
        );
        ((
          {} as (
            props: __VLS_FunctionalComponentProps<typeof __VLS_10, typeof __VLS_12> &
              Record<string, unknown>
          ) => void
        )({ ...{}, is: __VLS_ctx.avatar }));
        const __VLS_13 = __VLS_pickFunctionalComponentCtx(__VLS_10, __VLS_12)!;
        let __VLS_14!: __VLS_NormalizeEmits<typeof __VLS_13.emit>;
      }
      __VLS_8.slots!.default;
    }
    {
      const __VLS_15 = __VLS_intrinsicElements['div'];
      const __VLS_16 = __VLS_elementAsFunctionalComponent(__VLS_15);
      const __VLS_17 = __VLS_16(
        { ...{}, class: 'name' },
        ...__VLS_functionalComponentArgsRest(__VLS_16)
      );
      ((
        {} as (
          props: __VLS_FunctionalComponentProps<typeof __VLS_15, typeof __VLS_17> &
            Record<string, unknown>
        ) => void
      )({ ...{}, class: 'name' }));
      const __VLS_18 = __VLS_pickFunctionalComponentCtx(__VLS_15, __VLS_17)!;
      let __VLS_19!: __VLS_NormalizeEmits<typeof __VLS_18.emit>;
      __VLS_ctx.name;
      __VLS_18.slots!.default;
    }
    if (__VLS_ctx.isUser) {
      {
        const __VLS_20 = __VLS_intrinsicElements['div'];
        const __VLS_21 = __VLS_elementAsFunctionalComponent(__VLS_20);
        const __VLS_22 = __VLS_21(
          { ...{}, class: 'message-body', 'data-cy': 'message-text' },
          ...__VLS_functionalComponentArgsRest(__VLS_21)
        );
        ((
          {} as (
            props: __VLS_FunctionalComponentProps<typeof __VLS_20, typeof __VLS_22> &
              Record<string, unknown>
          ) => void
        )({ ...{}, class: 'message-body', 'data-cy': 'message-text' }));
        const __VLS_23 = __VLS_pickFunctionalComponentCtx(__VLS_20, __VLS_22)!;
        let __VLS_24!: __VLS_NormalizeEmits<typeof __VLS_23.emit>;
        __VLS_ctx.message;
        __VLS_23.slots!.default;
      }
      // @ts-ignore
      [isUser, isError, isUser, isError, avatar, avatar, avatar, name, isUser, message];
    } else {
      {
        const __VLS_25 = __VLS_intrinsicElements['div'];
        const __VLS_26 = __VLS_elementAsFunctionalComponent(__VLS_25);
        const __VLS_27 = __VLS_26(
          { ...{}, class: 'message-body', 'data-cy': 'message-text' },
          ...__VLS_functionalComponentArgsRest(__VLS_26)
        );
        ((
          {} as (
            props: __VLS_FunctionalComponentProps<typeof __VLS_25, typeof __VLS_27> &
              Record<string, unknown>
          ) => void
        )({ ...{}, class: 'message-body', 'data-cy': 'message-text' }));
        const __VLS_28 = __VLS_pickFunctionalComponentCtx(__VLS_25, __VLS_27)!;
        let __VLS_29!: __VLS_NormalizeEmits<typeof __VLS_28.emit>;
        __VLS_directiveFunction(__VLS_ctx.vHtml)(__VLS_ctx.renderedMarkdown);
      }
      // @ts-ignore
      [renderedMarkdown];
    }
    {
      const __VLS_30 = __VLS_intrinsicElements['div'];
      const __VLS_31 = __VLS_elementAsFunctionalComponent(__VLS_30);
      const __VLS_32 = __VLS_31(
        { ...{}, class: 'buttons' },
        ...__VLS_functionalComponentArgsRest(__VLS_31)
      );
      ((
        {} as (
          props: __VLS_FunctionalComponentProps<typeof __VLS_30, typeof __VLS_32> &
            Record<string, unknown>
        ) => void
      )({ ...{}, class: 'buttons' }));
      const __VLS_33 = __VLS_pickFunctionalComponentCtx(__VLS_30, __VLS_32)!;
      let __VLS_34!: __VLS_NormalizeEmits<typeof __VLS_33.emit>;
      if (!__VLS_ctx.isUser && __VLS_ctx.id) {
        {
          const __VLS_35 = __VLS_intrinsicElements['span'];
          const __VLS_36 = __VLS_elementAsFunctionalComponent(__VLS_35);
          const __VLS_37 = __VLS_36(
            {
              ...{ onClick: {} as any },
              'data-cy': 'feedback-good',
              class: {
                button: 1,
                sentiment: 1,
                'sentiment--good': 1,
                'sentiment--selected': __VLS_ctx.sentiment > 0,
              },
            },
            ...__VLS_functionalComponentArgsRest(__VLS_36)
          );
          ((
            {} as (
              props: __VLS_FunctionalComponentProps<typeof __VLS_35, typeof __VLS_37> &
                Record<string, unknown>
            ) => void
          )({
            ...{ onClick: {} as any },
            'data-cy': 'feedback-good',
            class: {
              button: 1,
              sentiment: 1,
              'sentiment--good': 1,
              'sentiment--selected': __VLS_ctx.sentiment > 0,
            },
          }));
          const __VLS_38 = __VLS_pickFunctionalComponentCtx(__VLS_35, __VLS_37)!;
          let __VLS_39!: __VLS_NormalizeEmits<typeof __VLS_38.emit>;
          __VLS_styleScopedClasses = {
            button: 1,
            sentiment: 1,
            'sentiment--good': 1,
            'sentiment--selected': sentiment > 0,
          };
          let __VLS_40 = {
            click: __VLS_pickEvent(
              __VLS_39['click'],
              ({} as __VLS_FunctionalComponentProps<typeof __VLS_36, typeof __VLS_37>).onClick
            ),
          };
          __VLS_40 = {
            click: ($event) => {
              if (!(!__VLS_ctx.isUser && __VLS_ctx.id)) return;
              __VLS_ctx.setSentiment(1);
              // @ts-ignore
              [isUser, id, sentiment, sentiment, setSentiment];
            },
          };
          {
            const __VLS_41 = (
              {} as 'VThumbIcon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx.VThumbIcon }
                : 'vThumbIcon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx.vThumbIcon }
                : 'v-thumb-icon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx['v-thumb-icon'] }
                : typeof __VLS_resolvedLocalAndGlobalComponents
            ).VThumbIcon;
            const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({ ...{} }));
            (({} as { VThumbIcon: typeof __VLS_41 }).VThumbIcon);
            const __VLS_43 = __VLS_42({ ...{} }, ...__VLS_functionalComponentArgsRest(__VLS_42));
            ((
              {} as (
                props: __VLS_FunctionalComponentProps<typeof __VLS_41, typeof __VLS_43> &
                  Record<string, unknown>
              ) => void
            )({ ...{} }));
            const __VLS_44 = __VLS_pickFunctionalComponentCtx(__VLS_41, __VLS_43)!;
            let __VLS_45!: __VLS_NormalizeEmits<typeof __VLS_44.emit>;
          }
          __VLS_38.slots!.default;
        }
      }
      if (!__VLS_ctx.isUser && __VLS_ctx.id) {
        {
          const __VLS_46 = __VLS_intrinsicElements['span'];
          const __VLS_47 = __VLS_elementAsFunctionalComponent(__VLS_46);
          const __VLS_48 = __VLS_47(
            {
              ...{ onClick: {} as any },
              'data-cy': 'feedback-bad',
              class: {
                button: 1,
                sentiment: 1,
                'sentiment--bad': 1,
                'sentiment--selected': __VLS_ctx.sentiment < 0,
              },
            },
            ...__VLS_functionalComponentArgsRest(__VLS_47)
          );
          ((
            {} as (
              props: __VLS_FunctionalComponentProps<typeof __VLS_46, typeof __VLS_48> &
                Record<string, unknown>
            ) => void
          )({
            ...{ onClick: {} as any },
            'data-cy': 'feedback-bad',
            class: {
              button: 1,
              sentiment: 1,
              'sentiment--bad': 1,
              'sentiment--selected': __VLS_ctx.sentiment < 0,
            },
          }));
          const __VLS_49 = __VLS_pickFunctionalComponentCtx(__VLS_46, __VLS_48)!;
          let __VLS_50!: __VLS_NormalizeEmits<typeof __VLS_49.emit>;
          __VLS_styleScopedClasses = {
            button: 1,
            sentiment: 1,
            'sentiment--bad': 1,
            'sentiment--selected': sentiment < 0,
          };
          let __VLS_51 = {
            click: __VLS_pickEvent(
              __VLS_50['click'],
              ({} as __VLS_FunctionalComponentProps<typeof __VLS_47, typeof __VLS_48>).onClick
            ),
          };
          __VLS_51 = {
            click: ($event) => {
              if (!(!__VLS_ctx.isUser && __VLS_ctx.id)) return;
              __VLS_ctx.setSentiment(-1);
              // @ts-ignore
              [isUser, id, sentiment, sentiment, setSentiment];
            },
          };
          {
            const __VLS_52 = (
              {} as 'VThumbIcon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx.VThumbIcon }
                : 'vThumbIcon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx.vThumbIcon }
                : 'v-thumb-icon' extends keyof typeof __VLS_ctx
                ? { VThumbIcon: typeof __VLS_ctx['v-thumb-icon'] }
                : typeof __VLS_resolvedLocalAndGlobalComponents
            ).VThumbIcon;
            const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({ ...{} }));
            (({} as { VThumbIcon: typeof __VLS_52 }).VThumbIcon);
            const __VLS_54 = __VLS_53({ ...{} }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            ((
              {} as (
                props: __VLS_FunctionalComponentProps<typeof __VLS_52, typeof __VLS_54> &
                  Record<string, unknown>
              ) => void
            )({ ...{} }));
            const __VLS_55 = __VLS_pickFunctionalComponentCtx(__VLS_52, __VLS_54)!;
            let __VLS_56!: __VLS_NormalizeEmits<typeof __VLS_55.emit>;
          }
          __VLS_49.slots!.default;
        }
      }
      __VLS_33.slots!.default;
    }
    __VLS_3.slots!.default;
  }
  if (typeof __VLS_styleScopedClasses === 'object' && !Array.isArray(__VLS_styleScopedClasses)) {
    __VLS_styleScopedClasses['message'];
    __VLS_styleScopedClasses['avatar'];
    __VLS_styleScopedClasses['name'];
    __VLS_styleScopedClasses['message-body'];
    __VLS_styleScopedClasses['message-body'];
    __VLS_styleScopedClasses['buttons'];
  }
  var __VLS_slots!: {};
  return __VLS_slots;
}
