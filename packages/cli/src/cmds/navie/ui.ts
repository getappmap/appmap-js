import EventEmitter from 'events';
import { Widgets, screen, box, form, textbox, button, textarea, list } from 'blessed';
import assert from 'assert';

interface IUI {
  enrollComponent(component: Widgets.BlessedElement): void;

  get jobDescription(): string;

  get screen(): Widgets.Screen;
}

class JobDescription {
  descriptionForm: Widgets.FormElement<unknown>;
  descriptionTextBox: Widgets.TextareaElement;

  constructor(private ui: IUI) {
    this.descriptionForm = form({
      parent: ui.screen,
      top: 0,
      left: '50%',
      width: '50%',
      height: 10,
      border: {
        type: 'line',
      },
      label: 'Job Description',
    });

    this.descriptionTextBox = textbox({
      parent: this.descriptionForm,
      name: 'description',
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      inputOnFocus: true,
      fg: 'white',
      bg: 'black',
    });

    this.ui.enrollComponent(this.descriptionTextBox);
  }
}

class ChatResponse {
  responseTextArea: Widgets.TextElement;

  constructor(private ui: IUI) {
    this.responseTextArea = textarea({
      parent: ui.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: '100%-6',
      align: 'left',
      valign: 'top',
      label: 'Response',
      mouse: false,
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
    this.ui.enrollComponent(this.responseTextArea);
  }

  addToken(token: string) {
    this.responseTextArea.setContent(this.responseTextArea.getContent() + token);
  }
}

class TestList extends EventEmitter {
  testList: Widgets.ListElement;

  constructor(private ui: IUI) {
    super();

    this.testList = list({
      parent: ui.screen,
      label: 'Test List',
      left: '50%',
      top: 10,
      width: '50%',
      height: '50%-10',
      border: {
        type: 'line',
      },
    });
    this.ui.enrollComponent(this.testList);
  }
}

class TaskList extends EventEmitter {
  taskList: Widgets.ListElement;

  constructor(private ui: IUI) {
    super();

    this.taskList = list({
      parent: ui.screen,
      label: 'Task List',
      left: '50%',
      top: '50%',
      width: '50%',
      height: '50%',
      border: {
        type: 'line',
      },
    });
    this.ui.enrollComponent(this.taskList);
  }
}

class ChatInput extends EventEmitter {
  questionBox: Widgets.TextboxElement;
  questionSubmit: Widgets.ButtonElement;
  questionSubmitName = 'ask';

  constructor(private ui: IUI, private question?: string) {
    super();

    const screenObj = ui.screen;

    const chatForm = form({
      parent: ui.screen,
      label: 'Question',
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
      inputOnFocus: true,
      value: this.question,
    });

    this.questionSubmit = button({
      parent: chatForm,
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
      screenObj.render();
      return false;
    });

    screenObj.append(chatForm);

    ui.enrollComponent(this.questionBox);
  }

  focusOnInput() {
    this.questionBox.focus();
    this.ui.screen.render();
  }

  clearButtonState() {
    this.questionSubmit.setContent(this.questionSubmitName);
  }
}

class MainWindow extends EventEmitter implements IUI {
  screen: Widgets.Screen;
  response: ChatResponse;
  chatInput: ChatInput;
  jobDescriptionComponent: JobDescription;

  question: string | undefined;
  codeSelection: string | undefined;
  prompt: string | undefined;

  componentIndex = 0;
  componentsList = new Array<Widgets.BlessedElement>();

  constructor(private ui: UI) {
    super();

    // Create a screen object.
    this.screen = screen({
      smartCSR: true,
    });

    this.screen.title = 'Navie';

    this.chatInput = new ChatInput(this, this.question);
    this.chatInput.on('ask', (data) => this.emit('ask', data));

    this.response = new ChatResponse(this);
    this.jobDescriptionComponent = new JobDescription(this);
    new TestList(this);
    new TaskList(this);

    {
      box({
        parent: this.screen,
        top: '100%-1',
        width: '50%',
        left: 'center',
        height: 1,
        content: "Press ESC then 'tab' to cycle the focus, 'q' to quit",
      });
    }

    this.screen.key(['tab'], () => {
      const activeElement = (this.componentIndex + 1) % this.componentsList.length;
      this.componentIndex = activeElement;
      this.componentsList[activeElement].focus();
      this.screen?.render();
    });

    this.screen.key(['q', 'C-c'], () => {
      this.emit('exit');
    });
  }

  get jobDescription(): string {
    return this.jobDescriptionComponent.descriptionTextBox.value;
  }

  enrollComponent(component: Widgets.BlessedElement): void {
    this.componentsList.push(component);
  }

  run() {
    assert(this.screen);
    assert(this.chatInput);

    this.chatInput.focusOnInput();
    this.screen.render();
  }

  shutdown() {
    this.screen.destroy();
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
