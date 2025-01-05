import { createMachine, assign } from 'xstate';

export const settingsMachine = createMachine({
  id: 'settings',
  initial: 'active',
  context: {
    isSoundOn: true,
    isMusicOn: true,
    isChattyMode: false,
    isDevMode: false,
    language: 'zh'
  },
  states: {
    active: {
      on: {
        TOGGLE_SOUND: {
          actions:
            assign(({ context }) => ({
              isSoundOn: !context.isSoundOn
            }))
        },
        TOGGLE_MUSIC: {
          actions: [
            assign(({ context }) => ({
              isMusicOn: !context.isMusicOn
            }))
          ]
        },
        TOGGLE_CHATTY: {
          actions: [
            assign(({ context }) => ({
              isChattyMode: !context.isChattyMode
            }))
          ]
        },
        TOGGLE_DEV: {
          actions: [
            assign(({ context }) => ({
              isDevMode: !context.isDevMode
            }))
          ]
        },
        CHANGE_LANGUAGE: {
          actions: [
            assign(({ context, event }) => ({
              language: event.value
            }))
          ]
        }
      }
    }
  }
}); 