import EventEmitter from 'events';
import { Widgets, screen, box, form, textbox, button, textarea, log } from 'blessed';

class ChatResponse {
  responseTextArea: Widgets.TextElement;

  constructor(private screen: Widgets.Screen) {
    this.responseTextArea = textarea({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: '100%-7',
      align: 'left',
      valign: 'top',
      label: 'Response',
      mouse: true,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow',
        },
        style: {
          inverse: true,
        },
      },
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'black',
      },
    });
  }

  addToken(token: string) {
    this.responseTextArea.setContent(this.responseTextArea.getContent() + token);
  }
}

class ChatInput extends EventEmitter {
  constructor(private screen: Widgets.Screen, private question?: string) {
    super();

    const screenObj = this.screen;

    const chatForm = form({
      parent: this.screen,
      label: 'Question',
      keys: true,
      left: '0',
      top: '100%-7',
      width: '50%',
      height: 5,
      autoNext: true,
      border: {
        type: 'line',
      },
    });

    const questionBox = textbox({
      parent: chatForm,
      name: 'question',
      top: 0,
      left: 0,
      height: 2,
      width: '100%-2',
      fg: 'white',
      bg: 'black',
      inputOnFocus: true,
      value: this.question,
    });

    const questionSubmit = button({
      parent: chatForm,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1,
      },
      left: 10,
      width: 'submitting'.length + 2,
      top: 2,
      // left: 10,
      // bottom: 2,
      name: 'ask',
      content: 'ask',
      style: {
        bg: 'blue',
        fg: 'white',
        focus: {
          bg: 'red',
        },
        hover: {
          bg: 'red',
        },
      },
    });

    questionBox.on('submit', () => {
      questionSubmit.press();
    });

    questionSubmit.on('press', () => {
      questionBox.setContent('');
      questionSubmit.setContent('submitting');
      // TODO: Disable the button for a moment
      chatForm.submit();
      screenObj.render();
    });

    type QuestionForm = {
      question: string;
    };

    chatForm.on('submit', (form: Widgets.FormElement<unknown>) => {
      const question = (form as unknown as QuestionForm).question;
      this.emit('ask', question);
    });

    this.screen.append(chatForm);

    // Focus our element.
    questionBox.focus();
  }
}

class MainWindow extends EventEmitter {
  screen?: Widgets.Screen;
  response?: ChatResponse;

  question: string | undefined;
  codeSelection: string | undefined;
  prompt: string | undefined;

  constructor(private ui: UI) {
    super();
  }

  run() {
    // Create a screen object.
    this.screen = screen({
      smartCSR: true,
    });

    this.screen.title = 'Navie';

    {
      box({
        parent: this.screen,
        top: '100%-1',
        width: '50%',
        left: 'center',
        height: 1,
        content: 'Press ESC twice to quit',
      });
    }

    const chatInput = new ChatInput(this.screen, this.question);
    chatInput.on('ask', (data) => this.emit('ask', data));

    this.response = new ChatResponse(this.screen);

    // Render the screen.
    this.screen.key(['escape', 'C-c'], () => {
      this.emit('exit');
    });
    this.screen.render();
  }

  shutdown() {
    if (this.screen) this.screen.destroy();

    this.screen = undefined;
  }

  addResponseToken(token: string) {
    this.response?.addToken(token);
    this.screen?.render();
  }
}

export default class UI extends EventEmitter {
  mainWindow?: MainWindow;

  run(question?: string, codeSelection?: string, prompt?: string): Promise<void> {
    const mainWindow = new MainWindow(this);
    mainWindow.question = question;
    mainWindow.codeSelection = codeSelection;
    mainWindow.prompt = prompt;

    mainWindow.on('ask', (data) => this.emit('ask', data));
    this.mainWindow = mainWindow;

    return new Promise((resolve) => {
      mainWindow.on('exit', () => {
        mainWindow.shutdown();
        resolve();
      });
      mainWindow.run();
    });
  }

  addResponseToken(token: string) {
    this.mainWindow?.addResponseToken(token);
  }
}
