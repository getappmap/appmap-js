export default {
  methods: {
    typewrite(el: HTMLElement, startCommands: string[]) {
      async function typewriter(el: HTMLElement, text: string) {
        return new Promise<void>(async (resolve) => {
          let textQueue = text;
          while (textQueue.length) {
            const char = textQueue[0];
            el.innerText += char;
            textQueue = textQueue.slice(1);
            await new Promise((resolve) => setTimeout(resolve, 100 + (Math.random() * 100 - 50)));
          }
          resolve();
        });
      }

      let currentIndex = 0;
      const typeNextCommand = async () => {
        const startCommand = startCommands[currentIndex];
        el.innerText = '';
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            if (!(el instanceof HTMLElement)) return;
            typewriter(el, startCommand).then(resolve);
          }, 1000);
        });
        currentIndex += 1;
        currentIndex = currentIndex % startCommands.length;
        await new Promise<void>((resolve) => setTimeout(resolve, Math.random() * 1000 + 1000));
        typeNextCommand();
      };

      typeNextCommand();
    },
  },
};
