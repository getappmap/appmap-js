class MyClass {
  public readonly name: string;

  constructor() {
    this.name = 'MyClass';
  }

  #myClassMethod() {
    return 'myClassMethod';
  }
}

function myFunction() {
  return 'myFunction';
}

const myOtherFunction = () => 'myOtherFunction';

type MyType = {
  name: string;
};

interface MyInterface {
  name: string;
}

enum MyEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

const myObject = {
  myObjectMethod: () => {},
};

// prettier-ignore
function newLineBraces()
{
}

// prettier-ignore
const $lineBreak = () => 
  {

  };
