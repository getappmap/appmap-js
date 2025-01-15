import EventEmitter from 'events';
import { Widgets, screen, box, form, textbox, button, textarea, list } from 'blessed';

class JobDescription {
  descriptionTextBox: Widgets.TextareaElement;

  constructor(private screen: Widgets.Screen) {
    this.descriptionTextBox = textbox({
      parent: this.screen,
      top: 0,
      left: '50%',
      width: '50%',
      height: 10,
      mouse: true,
      keys: true,
      inputOnFocus: true,
      label: 'Job Description',
      border: {
        type: 'line',
      },
    });

    this.descriptionTextBox.on('click', () => {
      // this.descriptionTextBox.focus();
      // screen.render();
      this.descriptionTextBox.editor((err, value) => {
        if (err) return;

        this.descriptionTextBox.setContent(value ?? '');
        screen.render();
      });
      return false;
    });
  }
}

class ChatResponse {
  responseTextArea: Widgets.TextElement;

  constructor(private screen: Widgets.Screen) {
    this.responseTextArea = textarea({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: '100%-6',
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
    });
  }

  addToken(token: string) {
    this.responseTextArea.setContent(this.responseTextArea.getContent() + token);
  }
}

class TestList extends EventEmitter {
  list: Widgets.ListElement;

  constructor(private screen: Widgets.Screen) {
    super();

    this.list = list({
      parent: this.screen,
      label: 'Test List',
      left: '50%',
      top: 10,
      width: '50%',
      height: '50%-10',
      border: {
        type: 'line',
      },
    });
  }
}

class TaskList extends EventEmitter {
  list: Widgets.ListElement;

  constructor(private screen: Widgets.Screen) {
    super();

    this.list = list({
      parent: this.screen,
      label: 'Task List',
      left: '50%',
      top: '50%',
      width: '50%',
      height: '50%',
      border: {
        type: 'line',
      },
    });
  }
}

class ChatInput extends EventEmitter {
  questionBox: Widgets.TextboxElement;
  questionSubmit: Widgets.ButtonElement;
  questionSubmitName = 'ask';

  constructor(private screen: Widgets.Screen, private question?: string) {
    super();

    const screenObj = this.screen;

    const chatForm = form({
      parent: this.screen,
      label: 'Question',
      keys: true,
      left: '0',
      top: '100%-6',
      width: '50%',
      height: 5,
      autoNext: true,
      wrap: true,
      border: {
        type: 'line',
      },
    });

    this.questionBox = textbox({
      parent: chatForm,
      name: 'question',
      top: 0,
      left: 0,
      height: 2,
      width: '100%-2',
      fg: 'white',
      bg: 'black',
      keys: true,
      inputOnFocus: true,
      value: this.question,
    });

    this.questionSubmit = button({
      parent: chatForm,
      // mouse: true,
      keys: true,
      right: 0,
      width: 'submitting'.length + 4,
      top: 2,
      name: 'ask',
      content: 'ask',
      align: 'center',
      style: {
        bg: 'cyan',
        fg: 'black',
        focus: {
          bg: 'white',
        },
        hover: {
          bg: 'white',
        },
      },
    });

    this.questionBox.on('submit', () => {
      this.questionSubmit.press();
    });

    this.questionSubmit.on('press', () => {
      this.questionBox.setContent('');
      this.questionSubmit.setContent('submitting');
      // TODO: Disable the button for a moment
      chatForm.submit();
      screenObj.render();
    });

    type QuestionForm = {
      question: string;
    };

    chatForm.on('submit', (form: Widgets.FormElement<unknown>) => {
      const question = (form as unknown as QuestionForm).question;
      if (!question) return;

      this.emit('ask', question);
    });

    this.questionBox.on('click', () => {
      this.questionBox.focus();
      screen.render();
      return false;
    });

    this.screen.append(chatForm);
  }

  focusOnInput() {
    this.questionBox.focus();
    this.screen.render();
  }

  clearButtonState() {
    this.questionSubmit.setContent(this.questionSubmitName);
  }
}

class MainWindow extends EventEmitter {
  screen?: Widgets.Screen;
  response?: ChatResponse;
  chatInput?: ChatInput;

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

    this.chatInput = new ChatInput(this.screen, this.question);
    this.chatInput.on('ask', (data) => this.emit('ask', data));

    this.response = new ChatResponse(this.screen);
    new JobDescription(this.screen);
    new TestList(this.screen);
    new TaskList(this.screen);

    // Render the screen.
    this.screen.key(['escape', 'C-c'], () => {
      this.emit('exit');
    });

    this.chatInput.focusOnInput();
    this.screen.render();
  }

  shutdown() {
    if (this.screen) this.screen.destroy();

    this.screen = undefined;
  }

  addResponseToken(token: string) {
    this.response?.addToken(token);
    this.chatInput?.clearButtonState();
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
