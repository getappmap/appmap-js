#define MODE_DEFAULT 0
#define MODE_NONE    (MODE_DEFAULT - 1)
#define MODE_SUPER   (MODE_DEFAULT + 1)

typedef struct {
  int a;
  int b;
} Point;

struct MyStruct {
  int a;
  int b;
};

struct MyOtherStruct
{
};

void foo()
{

}

int main() {
  Point p;
  foo();
  p.a = 1;
  p.b = 2;
  return p.a + p.b;
}
