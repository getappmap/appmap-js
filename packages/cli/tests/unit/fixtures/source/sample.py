from my_module import perform_operation as perform, MyBaseClass

def some_function():
    print("Hello, world!")

class MyClass(MyBaseClass):
    def __init__(self, name):
        super().__init__(name)
        self.name = name

    def say_hello(self):
        print(f"Hello, {self.name}!")


if __name__ == "__main__":
    """
    This is a sample Python script.
    """
    my_array = [1, 2, 3]
    [
        perform(result)
        for result in my_array
    ]