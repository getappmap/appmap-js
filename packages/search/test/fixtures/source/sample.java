public enum SampleEnum {
    A, B, C
}

public @interface SampleAnnotation {
}

public interface ISample {
    public void sampleMethod();
}

public class Sample {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}

public void performUserOperation(User user,
                                 Operation op) {
    super.performUserOperation(user, op);
}
