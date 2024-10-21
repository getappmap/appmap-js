public class ClassOne { }

public class ClassTwo : IInterface { }

public partial class ClassThree<T> { }

class ClassFour
{

}

public struct StructOne<T> { }

struct StructTwo
{
}

readonly public struct StructThree : IInterface { }

interface IOne { }

public interface ITwo : ISomethingElse
{

};

private interface IThree<T> { }

namespace MyNamespace
{
  interface IFour
  {
  }
}

enum Example { One, Two, Three }

enum Season
{
  Spring,
  Summer,
  Autumn,
  Winter
}

enum ErrorCode : ushort
{
  None = 0,
  Unknown = 1,

  ConnectionLost = 100,
  OutlierReading = 200
}

class ClassWithMethods
{
  ClassWithMethods() { }
  ~ClassWithMethods() { }
  public void MethodOne() { }
  public static void MethodTwo() { }
  ISomething MethodThree()
  {
    FunctionCall()
  }
  ISomething MethodFour()
  {
  }
}


#if (DEBUG)
Console.WriteLine("Hello World");
#else
Console.WriteLine("Goodbye World");
#endif
