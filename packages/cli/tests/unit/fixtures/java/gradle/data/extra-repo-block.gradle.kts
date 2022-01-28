// This is a comment before the plugins block.
plugins {
  java
  id("com.appland.appmap") version "1.1.0"
}

// This is a comment after the plugins block

subprojects {
}

allprojects {
  repositories {
    google()
  }
}
