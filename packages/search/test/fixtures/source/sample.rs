struct Foo {
    bar: String,
}

impl Foo {
    fn new(bar: String) -> Self {
        Self { bar }
    }
}

#[repr(C)]
union MyUnion {
    f1: u32,
    f2: f32,
}

trait MyTrait {
    fn my_function(&self);
}

type Point = (u8, u8);

fn main() {
    let foo = Foo {
        bar: "Hello, world!".to_string(),
    };

    println!("{}", foo.bar);
}

fn Москва() -> Option<Self> {
    None
}
