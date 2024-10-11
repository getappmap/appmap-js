type Locker interface {
	Lock()
	Unlock()
}

type MyInterface interface {
	// TODO: Interface methods are not captured
	//       This symbol will not be reported
	MyMethod()
}

type LockerImpl struct {
}

func (l *LockerImpl) Lock() {
}

func (l *LockerImpl) Unlock() {
}

type Reader interface {
	Read(p []byte) (n int, err error)
}

type ReadWriter interface {
	Reader  // includes methods of Reader in ReadWriter's method set
	Writer  // includes methods of Writer in ReadWriter's method set
}

func main() {
	fmt.Println("Hello, World!")
}

func unicodeβ(s string) string {
	return s
}
