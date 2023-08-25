
// http://man7.org/linux/man-pages/man7/unix.7.html
// struct sockaddr_un {
//    sa_family_t sun_family;               /* AF_UNIX */
//    char        sun_path[108];            /* pathname */
// };

// https://linux.die.net/man/7/ip
// struct sockaddr_in {
//     sa_family_t    sin_family; /* address family: AF_INET */
//     in_port_t      sin_port;   /* port in network byte order */
//     struct in_addr sin_addr;   /* internet address */
// };
// struct in_addr {
//     uint32_t       s_addr;     /* address in network byte order */
// };

// http://man7.org/linux/man-pages/man7/ipv6.7.html
// struct sockaddr_in6 {
//    sa_family_t     sin6_family;   /* AF_INET6 */
//    in_port_t       sin6_port;     /* port number */
//    uint32_t        sin6_flowinfo; /* IPv6 flow information */
//    struct in6_addr sin6_addr;     /* IPv6 address */
//    uint32_t        sin6_scope_id; /* Scope ID (new in 2.4) */
// };
// struct in6_addr {
//    unsigned char   s6_addr[16];   /* IPv6 address */
// };

#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <netinet/udp.h>
#include <arpa/inet.h>
#include <iostream>
#include <node.h>
#include <cstring>

#if NODE_MAJOR_VERSION < 12
  #define GET_DATA(buffer) (NULL)
  #error "node version must be >= 12.0.0 (end-of-life)"
#elif NODE_MAJOR_VERSION == 13
  #define GET_DATA(buffer) (NULL)
  #error "node version cannot be 13.x.x (end-of-life)"
#elif (NODE_MAJOR_VERSION == 12)
  #define GET_DATA(buffer) (buffer->GetContents().Data())
#else
  #define GET_DATA(buffer) (buffer->GetBackingStore()->Data())
#endif

static size_t max_length;

void ThrowErrno (v8::Isolate* isolate) {
  char string[100];
  snprintf(string, 100, "ERRNO %i: %s", errno, std::strerror(errno));
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  v8::Local<v8::Object> error = v8::Exception::Error(v8::String::NewFromUtf8(isolate, string, v8::NewStringType::kNormal).ToLocalChecked())->ToObject(context).ToLocalChecked();
  error->Set(context, v8::String::NewFromUtf8(isolate, "errno", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, errno)).ToChecked();
  error->Set(context, v8::String::NewFromUtf8(isolate, "code", v8::NewStringType::kNormal).ToLocalChecked(), v8::String::NewFromUtf8(isolate, std::strerror(errno), v8::NewStringType::kNormal).ToLocalChecked()).ToChecked();
  isolate->ThrowException(error);
}

void ThrowMessage (v8::Isolate* isolate, const char* message) {
  isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate, message, v8::NewStringType::kNormal).ToLocalChecked()));
}

int ThrowErrnoInt (v8::Isolate* isolate, int result) {
  ThrowErrno(isolate);
  return result;
}

int ThrowMessageInt (v8::Isolate* isolate, const char* message, int result) {
  ThrowMessage(isolate, message);
  return result;
}

// Convert a JavaScript value to a sockaddr
int ObjectToAddress (v8::Object* object, sockaddr* address) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (object->Has(context, v8::String::NewFromUtf8(isolate, "sun_family", v8::NewStringType::kNormal).ToLocalChecked()).ToChecked()) {
    v8::Local<v8::Value> sun_family = object->Get(context, v8::String::NewFromUtf8(isolate, "sun_family", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sun_path = object->Get(context, v8::String::NewFromUtf8(isolate, "sun_path", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    if (!sun_family->IsNumber())
      return ThrowMessageInt(isolate, "addr.sun_family must be a Number", -1);
    if (!sun_path->IsString())
      return ThrowMessageInt(isolate, "addr.sun_path must be a String", -1);
    ((struct sockaddr_un *) address)->sun_family = sun_family->Uint32Value(context).FromMaybe(0);
    strncpy(((struct sockaddr_un *) address)->sun_path, *v8::String::Utf8Value(isolate, sun_path), sizeof(((sockaddr_un*)0)->sun_path));
    return sizeof(sockaddr_un);
  }
  if (object->Has(context, v8::String::NewFromUtf8(isolate, "sin_family", v8::NewStringType::kNormal).ToLocalChecked()).ToChecked()) {
    v8::Local<v8::Value> sin_family = object->Get(context, v8::String::NewFromUtf8(isolate, "sin_family", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin_port = object->Get(context, v8::String::NewFromUtf8(isolate, "sin_port", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin_addr = object->Get(context, v8::String::NewFromUtf8(isolate, "sin_addr", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    if (!sin_family->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin_family must be a Number", -1);
    if (!sin_port->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin_port must be a Number", -1);
    if (sin_port->Uint32Value(context).FromMaybe(0) > UINT16_MAX)
      return ThrowMessageInt(isolate, "addr.sin_port is superior to UINT16_MAX", -1);
    if (!sin_addr->IsString())
      return ThrowMessageInt(isolate, "addr.sin_addr must be a String", -1);
    ((struct sockaddr_in *) address)->sin_family = sin_family->Uint32Value(context).FromMaybe(0);
    ((struct sockaddr_in *) address)->sin_port = htons(sin_port->Uint32Value(context).FromMaybe(0));
    if (inet_pton(AF_INET, *v8::String::Utf8Value(isolate, sin_addr), &(((struct sockaddr_in *) address)->sin_addr)) == 0)
      return ThrowMessageInt(isolate, "addr.sin_addr could not be parsed", -1);
    return sizeof(sockaddr_in);
  }
  if (object->Has(context, v8::String::NewFromUtf8(isolate, "sin6_family", v8::NewStringType::kNormal).ToLocalChecked()).ToChecked()) {
    v8::Local<v8::Value> sin6_family = object->Get(context, v8::String::NewFromUtf8(isolate, "sin6_family", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin6_port = object->Get(context, v8::String::NewFromUtf8(isolate, "sin6_port", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin6_flowinfo = object->Get(context, v8::String::NewFromUtf8(isolate, "sin6_flowinfo", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin6_addr = object->Get(context, v8::String::NewFromUtf8(isolate, "sin6_addr", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    v8::Local<v8::Value> sin6_scope_id = object->Get(context, v8::String::NewFromUtf8(isolate, "sin6_scope_id", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    if (!sin6_family->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin6_family must be a Number", -1);
    if (!sin6_port->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin6_port must be a Number", -1);
    if (sin6_port->Uint32Value(context).FromMaybe(0) > UINT16_MAX)
      return ThrowMessageInt(isolate, "addr.sin6_port is superior to UINT16_MAX", -1);
    if (!sin6_flowinfo->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin6_flowinfo must be a Number", -1);
    if (!sin6_addr->IsString())
      return ThrowMessageInt(isolate, "addr.sin6_addr must be a String", -1);
    if (!sin6_scope_id->IsNumber())
      return ThrowMessageInt(isolate, "addr.sin6_scope_id must be a Number", -1);
    ((struct sockaddr_in6 *) address)->sin6_family = sin6_family->Uint32Value(context).FromMaybe(0);
    ((struct sockaddr_in6 *) address)->sin6_port = htons(sin6_port->Uint32Value(context).FromMaybe(0));
    ((struct sockaddr_in6 *) address)->sin6_flowinfo = sin6_flowinfo->Uint32Value(context).FromMaybe(0);
    if (inet_pton(AF_INET6, *v8::String::Utf8Value(isolate, sin6_addr), &(((struct sockaddr_in6 *) address)->sin6_addr)) == 0)
      return ThrowMessageInt(isolate, "addr.sin6_addr could not be parsed", -1);
    ((struct sockaddr_in6 *) address)->sin6_scope_id = sin6_scope_id->Uint32Value(context).FromMaybe(0);
    return sizeof(sockaddr_in6);
  }
  return ThrowMessageInt(isolate, "addr must contain either sun_family, sin_family, or sin6_family", -1);
};

void AddressToObject (sockaddr* address, v8::Object* object) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (address->sa_family == AF_UNIX || address->sa_family == AF_LOCAL) {
    sa_family_t sun_family = ((struct sockaddr_un*) address)->sun_family;
    char* sun_path = ((struct sockaddr_un*) address)->sun_path;
    object->Set(context, v8::String::NewFromUtf8(isolate, "sun_family", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sun_family)).ToChecked();
    object->Set(context, v8::String::NewFromUtf8(isolate, "sun_path", v8::NewStringType::kNormal).ToLocalChecked(), v8::String::NewFromUtf8(isolate, sun_path, v8::NewStringType::kNormal).ToLocalChecked()).ToChecked();
  } else if (address->sa_family == AF_INET) {
    sa_family_t sin_family = ((struct sockaddr_in*) address)->sin_family;
    in_port_t sin_port = ntohs(((struct sockaddr_in*) address)->sin_port);
    char sin_addr[20];
    if (inet_ntop(AF_INET, &((struct sockaddr_in*) address)->sin_addr, sin_addr, 20) == NULL) {
      ThrowErrno(isolate);
    } else {
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin_family", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin_family)).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin_port", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin_port)).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin_addr", v8::NewStringType::kNormal).ToLocalChecked(), v8::String::NewFromUtf8(isolate, sin_addr, v8::NewStringType::kNormal).ToLocalChecked()).ToChecked();
    }
  } else if (address->sa_family == AF_INET6) {
    sa_family_t sin6_family = ((struct sockaddr_in6*) address)->sin6_family;
    in_port_t sin6_port = ntohs(((struct sockaddr_in6*) address)->sin6_port);
    uint32_t sin6_flowinfo = ((struct sockaddr_in6*) address)->sin6_flowinfo;
    char sin6_addr[50];
    if (inet_ntop(AF_INET6, &((struct sockaddr_in6*) address)->sin6_addr, sin6_addr, 50) == NULL) {
      ThrowErrno(isolate);
    } else {
      uint32_t sin6_scope_id = ((struct sockaddr_in6*) address)->sin6_scope_id;
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin6_family", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin6_family)).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin6_port", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin6_port)).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin6_flowinfo", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin6_flowinfo)).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin6_addr", v8::NewStringType::kNormal).ToLocalChecked(), v8::String::NewFromUtf8(isolate, sin6_addr, v8::NewStringType::kNormal).ToLocalChecked()).ToChecked();
      object->Set(context, v8::String::NewFromUtf8(isolate, "sin6_scope_id", v8::NewStringType::kNormal).ToLocalChecked(), v8::Number::New(isolate, sin6_scope_id)).ToChecked();
    }
  } else {
    ThrowMessage(isolate, "only the following address families are supported: AF_UNIX, AF_LOCAL, AF_INET and, AF_INET6");
  }
}

// http://man7.org/linux/man-pages/man2/socket.2.html
// int socket(int domain, int type, int protocol);
void Socket(const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = info.GetIsolate();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 3)
    return ThrowMessage(isolate, "socket(domain, type, protocol) expects 3 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "domain must be a Number");
  if (!info[1]->IsNumber())
    return ThrowMessage(isolate, "type must be a Number");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "protocol must be a Number");
  int socketfd = socket(info[0]->Int32Value(context).FromMaybe(0), info[1]->Int32Value(context).FromMaybe(0), info[2]->Int32Value(context).FromMaybe(0));
  if (socketfd == -1) {
    ThrowErrno(isolate);
  } else {
    info.GetReturnValue().Set(v8::Integer::New(isolate, socketfd));
  }
}

// http://man7.org/linux/man-pages/man2/connect.2.html
// int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
void Connect (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = info.GetIsolate();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "connect(sockfd, addr) expects 2 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsObject())
    return ThrowMessage(isolate, "addr must be an Object");
  sockaddr* address = (sockaddr*) malloc(max_length);
  int length = ObjectToAddress(v8::Object::Cast(*info[1]), address);
  if (length != -1) {
    if (connect(info[0]->Int32Value(context).FromMaybe(0), address, length) == -1) {
      ThrowErrno(isolate);
    }
  }
  free(address);
};

// http://man7.org/linux/man-pages/man2/bind.2.html
// int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
void Bind (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = info.GetIsolate();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "connect(sockfd, addr) expects 2 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  sockaddr* address = (sockaddr*) malloc(max_length);
  int length = ObjectToAddress(v8::Object::Cast(*info[1]), address);
  if (length != -1) {
    if (bind(info[0]->Int32Value(context).FromMaybe(0), address, length) == -1) {
      ThrowErrno(isolate);
    }
  }
  free(address);
};

// http://man7.org/linux/man-pages/man2/listen.2.html
// int listen(int sockfd, int backlog);
void Listen (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = info.GetIsolate();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "listen(sockfd, backlog) expects 2 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsNumber())
    return ThrowMessage(isolate, "backlog must be a Number");
  if (listen(info[0]->Int32Value(context).FromMaybe(0), info[1]->Int32Value(context).FromMaybe(0)) == -1) {
    ThrowErrno(isolate);
  }
}

// http://man7.org/linux/man-pages/man2/accept.2.html
// int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
void Accept (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "accept(sockfd, addr) expects 2 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsObject())
    return ThrowMessage(isolate, "addr must be an Object");
  sockaddr* address = (sockaddr*) malloc(max_length);
  socklen_t actual_length = max_length;
  int sockfd = accept(info[0]->Int32Value(context).FromMaybe(0), address, &actual_length);
  if (sockfd == -1) {
    ThrowErrno(isolate);
  } else {
    AddressToObject(address, v8::Object::Cast(*info[1]));
    info.GetReturnValue().Set(v8::Integer::New(isolate, sockfd));
  }
  free(address);
}

// http://man7.org/linux/man-pages/man2/send.2.html
// ssize_t send(int sockfd, void *buf, size_t len, int flags);
void Send (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 4)
    return ThrowMessage(isolate, "send(sockfd, buf, len, flags) expects 4 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsArrayBuffer())
    return ThrowMessage(isolate, "buf must be an ArrayBuffer");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "len must be a number");
  if (!info[3]->IsNumber())
    return ThrowMessage(isolate, "flags must be a Number");
  ssize_t size = send(info[0]->Int32Value(context).FromMaybe(0), GET_DATA(v8::ArrayBuffer::Cast(*(info[1]))), info[2]->Int32Value(context).FromMaybe(0), info[3]->Int32Value(context).FromMaybe(0));
  if (size == -1) {
    ThrowErrno(isolate);
  } else {
    info.GetReturnValue().Set(v8::Integer::New(isolate, size));
  }
};

// http://man7.org/linux/man-pages/man2/send.2.html
// ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);
void Sendto (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 5)
    return ThrowMessage(isolate, "sendto(sockfd, buf, len, flags, dest_addr) expects 5 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsArrayBuffer())
    return ThrowMessage(isolate, "buf must be an ArrayBuffer");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "len must be a number");
  if (!info[3]->IsNumber())
    return ThrowMessage(isolate, "flags must be a number");
  if (!info[4]->IsObject())
    return ThrowMessage(isolate, "dest_addr must be an object");
  sockaddr* address = (sockaddr*) malloc(max_length);
  int length = ObjectToAddress(v8::Object::Cast(*info[4]), address);
  if (length != -1) {
    ssize_t size = sendto(info[0]->Int32Value(context).FromMaybe(0), GET_DATA(v8::ArrayBuffer::Cast(*(info[1]))), info[2]->Int32Value(context).FromMaybe(0), info[3]->Int32Value(context).FromMaybe(0), address, length);
    if (size == -1) {
      ThrowErrno(isolate);
    } else {
      AddressToObject(address, v8::Object::Cast(*info[3]));
      info.GetReturnValue().Set(v8::Integer::New(isolate, size));
    }
  }
  free(address);
}

// http://man7.org/linux/man-pages/man2/recv.2.html
// ssize_t recv(int sockfd, void *buf, size_t len, int flags);
void Recv (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 4)
    return ThrowMessage(isolate, "recv(sockfd, buf, len flags) expects 4 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsArrayBuffer())
    return ThrowMessage(isolate, "buf must be an ArrayBuffer");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "len must be a number");
  if (!info[3]->IsNumber())
    return ThrowMessage(isolate, "flags must be a Number");
  ssize_t size = recv(info[0]->Int32Value(context).FromMaybe(0), GET_DATA(v8::ArrayBuffer::Cast(*(info[1]))), info[2]->Int32Value(context).FromMaybe(0), info[3]->Int32Value(context).FromMaybe(0));
  if (size == -1) {
    ThrowErrno(isolate);
  } else {
    info.GetReturnValue().Set(v8::Integer::New(isolate, size));
  }
};

// http://man7.org/linux/man-pages/man2/recv.2.html
// ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, struct sockaddr *src_addr, socklen_t *addrlen);
void Recvfrom (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 5)
    return ThrowMessage(isolate, "recvfrom(sockfd, buf, len, flags, src_addr) expects 4 arguments");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsArrayBuffer())
    return ThrowMessage(isolate, "buf must be an ArrayBuffer");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "len must be a number");
  if (!info[3]->IsNumber())
    return ThrowMessage(isolate, "flags must be a number");
  if (!info[4]->IsObject())
    return ThrowMessage(isolate, "src_addr must be an object");
  sockaddr* address = (sockaddr*) malloc(max_length);
  socklen_t actual_length = max_length;
  ssize_t size = recvfrom(info[0]->Int32Value(context).FromMaybe(0), GET_DATA(v8::ArrayBuffer::Cast(*(info[1]))), info[2]->Int32Value(context).FromMaybe(0), info[3]->Int32Value(context).FromMaybe(0), address, &actual_length);
  if (size == -1) {
    ThrowErrno(isolate);
  } else {
    AddressToObject(address, v8::Object::Cast(*info[3]));
    info.GetReturnValue().Set(v8::Integer::New(isolate, size));
  }
  free(address);
}

// http://man7.org/linux/man-pages/man2/close.2.html
// int close(int fd);
void Close (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 1)
    return ThrowMessage(isolate, "close(fd) expects 1 argument");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "fd must be a Number");
  if (close(info[0]->Int32Value(context).FromMaybe(0)) == -1) {
    ThrowErrno(isolate);
  }
}

// http://man7.org/linux/man-pages/man2/shutdown.2.html
// int shutdown(int sockfd, int how);
void Shutdown (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "shutdown(sockfd, how) expects 2 argument");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsNumber())
    return ThrowMessage(isolate, "how must be a Number");
  if (shutdown(info[0]->Int32Value(context).FromMaybe(0), info[1]->Int32Value(context).FromMaybe(0)) == -1) {
    ThrowErrno(isolate);
  }
}

// http://man7.org/linux/man-pages/man2/getsockopt.2.html
// int getsockopt(int sockfd, int level, int optname, void *optval, socklen_t *optlen);
void Getsockopt (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 2)
    return ThrowMessage(isolate, "getsockopt(sockfd, level, optname) expects 3 argument");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsNumber())
    return ThrowMessage(isolate, "level must be a Number");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "optname must be a Number");
  int optval;
  socklen_t optlen = sizeof(int);
  if (getsockopt(info[0]->Int32Value(context).FromMaybe(0), info[1]->Int32Value(context).FromMaybe(0), info[2]->Int32Value(context).FromMaybe(0), (void *) &optval, &optlen) == -1) {
    ThrowErrno(isolate);
  } else {
    info.GetReturnValue().Set(v8::Integer::New(isolate, optval));
  }
}

// http://man7.org/linux/man-pages/man2/setsockopt.2.html
// int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen);
void Setsockopt (const v8::FunctionCallbackInfo<v8::Value>& info) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();
  if (info.Length() != 4)
    return ThrowMessage(isolate, "getsockopt(sockfd, level, optname, optval) expects 4 argument");
  if (!info[0]->IsNumber())
    return ThrowMessage(isolate, "sockfd must be a Number");
  if (!info[1]->IsNumber())
    return ThrowMessage(isolate, "level must be a Number");
  if (!info[2]->IsNumber())
    return ThrowMessage(isolate, "optname must be a Number");
  if (!info[3]->IsNumber())
    return ThrowMessage(isolate, "optval must be a Number");
  int optval = info[0]->Int32Value(context).FromMaybe(0);
  socklen_t optlen = sizeof(int);
  if (setsockopt(info[0]->Int32Value(context).FromMaybe(0), info[1]->Int32Value(context).FromMaybe(0), info[2]->Int32Value(context).FromMaybe(0), (void *) &optval, optlen) == -1) {
    ThrowErrno(isolate);
  }
}

void Initialize(v8::Local<v8::Object> exports) {

  max_length = sizeof(sockaddr_un);
  max_length = sizeof(sockaddr_in)  > max_length ? sizeof(sockaddr_in)  : max_length;
  max_length = sizeof(sockaddr_in6) > max_length ? sizeof(sockaddr_in6) : max_length;

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Context> context = isolate->GetEnteredOrMicrotaskContext();

  // Address Family -- http://man7.org/linux/man-pages/man2/socket.2.html //
  #ifdef AF_UNIX
    exports->Set(context, v8::String::NewFromUtf8(isolate, "AF_UNIX", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, AF_UNIX)).ToChecked();
  #endif
  #ifdef AF_LOCAL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "AF_LOCAL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, AF_LOCAL)).ToChecked();
  #endif
  #ifdef AF_INET
    exports->Set(context, v8::String::NewFromUtf8(isolate, "AF_INET", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, AF_INET)).ToChecked();
  #endif
  #ifdef AF_INET6
    exports->Set(context, v8::String::NewFromUtf8(isolate, "AF_INET6", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, AF_INET6)).ToChecked();
  #endif

  // Socket Type -- http://man7.org/linux/man-pages/man2/socket.2.html //
  #ifdef SOCK_STREAM
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SOCK_STREAM", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SOCK_STREAM)).ToChecked();
  #endif
  #ifdef SOCK_DGRAM
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SOCK_DGRAM", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SOCK_DGRAM)).ToChecked();
  #endif
  #ifdef SOCK_SEQPACKET
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SOCK_SEQPACKET", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SOCK_SEQPACKET)).ToChecked();
  #endif
  #ifdef SOCK_RAW
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SOCK_RAW", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SOCK_RAW)).ToChecked();
  #endif

  // Send Flags -- http://man7.org/linux/man-pages/man2/send.2.html //
  #ifdef MSG_CONFIRM
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_CONFIRM", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_CONFIRM)).ToChecked();
  #endif
  #ifdef MSG_DONTROUTE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_DONTROUTE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_DONTROUTE)).ToChecked();
  #endif
  #ifdef MSG_DONTWAIT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_DONTWAIT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_DONTWAIT)).ToChecked();
  #endif
  #ifdef MSG_EOR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_EOR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_EOR)).ToChecked();
  #endif
  #ifdef MSG_MORE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_MORE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_MORE)).ToChecked();
  #endif
  #ifdef MSG_NOSIGNAL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_NOSIGNAL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_NOSIGNAL)).ToChecked();
  #endif
  #ifdef MSG_OOB
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_OOB", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_OOB)).ToChecked();
  #endif

  // Recv Flags -- http://man7.org/linux/man-pages/man2/recv.2.html //
  #ifdef MSG_CMSG_CLOEXEC
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_CMSG_CLOEXEC", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_CMSG_CLOEXEC)).ToChecked();
  #endif
  #ifdef MSG_DONTWAIT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_DONTWAIT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_DONTWAIT)).ToChecked();
  #endif
  #ifdef MSG_ERRQUEUE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_ERRQUEUE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_ERRQUEUE)).ToChecked();
  #endif
  #ifdef MSG_OOB
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_OOB", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_OOB)).ToChecked();
  #endif
  #ifdef MSG_PEEK
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_PEEK", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_PEEK)).ToChecked();
  #endif
  #ifdef MSG_TRUNC
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_TRUNC", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_TRUNC)).ToChecked();
  #endif
  #ifdef MSG_WAITALL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "MSG_WAITALL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, MSG_WAITALL)).ToChecked();
  #endif

  // Shutdown Flags -- http://man7.org/linux/man-pages/man2/shutdown.2.html //
  #ifdef SHUT_RD
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SHUT_RD", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SHUT_RD)).ToChecked();
  #endif
  #ifdef SHUT_WR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SHUT_WR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SHUT_WR)).ToChecked();
  #endif
  #ifdef SHUT_RDWR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SHUT_RDWR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SHUT_RDWR)).ToChecked();
  #endif

 // Socket-Level Options -- http://man7.org/linux/man-pages/man7/socket.7.html
  #ifdef SOL_SOCKET
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SOL_SOCKET", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SOL_SOCKET)).ToChecked();
  #endif
  #ifdef SO_ACCEPTCONN
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_ACCEPTCONN", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_ACCEPTCONN)).ToChecked();
  #endif
  #ifdef SO_ATTACH_FILTER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_ATTACH_FILTER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_ATTACH_FILTER)).ToChecked();
  #endif
  #ifdef SO_ATTACH_REUSEPORT_CBPF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_ATTACH_REUSEPORT_CBPF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_ATTACH_REUSEPORT_CBPF)).ToChecked();
  #endif
  #ifdef SO_ATTACH_REUSEPORT_EBPF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_ATTACH_REUSEPORT_EBPF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_ATTACH_REUSEPORT_EBPF)).ToChecked();
  #endif
  #ifdef SO_BINDTODEVICE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_BINDTODEVICE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_BINDTODEVICE)).ToChecked();
  #endif
  #ifdef SO_BROADCAST
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_BROADCAST", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_BROADCAST)).ToChecked();
  #endif
  #ifdef SO_BSDCOMPAT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_BSDCOMPAT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_BSDCOMPAT)).ToChecked();
  #endif
  #ifdef SO_DEBUG
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_DEBUG", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_DEBUG)).ToChecked();
  #endif
  #ifdef SO_DETACH_FILTER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_DETACH_FILTER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_DETACH_FILTER)).ToChecked();
  #endif
  #ifdef SO_DOMAIN
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_DOMAIN", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_DOMAIN)).ToChecked();
  #endif
  #ifdef SO_ERROR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_ERROR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_ERROR)).ToChecked();
  #endif
  #ifdef SO_DONTROUTE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_DONTROUTE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_DONTROUTE)).ToChecked();
  #endif
  #ifdef SO_INCOMING_CPU
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_INCOMING_CPU", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_INCOMING_CPU)).ToChecked();
  #endif
  #ifdef SO_KEEPALIVE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_KEEPALIVE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_KEEPALIVE)).ToChecked();
  #endif
  #ifdef SO_LINGER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_LINGER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_LINGER)).ToChecked();
  #endif
  #ifdef SO_LOCK_FILTER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_LOCK_FILTER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_LOCK_FILTER)).ToChecked();
  #endif
  #ifdef SO_MARK
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_MARK", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_MARK)).ToChecked();
  #endif
  #ifdef SO_OOBINLINE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_OOBINLINE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_OOBINLINE)).ToChecked();
  #endif
  #ifdef SO_PASSCRED
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_PASSCRED", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_PASSCRED)).ToChecked();
  #endif
  #ifdef SO_PEEK_OFF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_PEEK_OFF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_PEEK_OFF)).ToChecked();
  #endif
  #ifdef SO_PEERCRED
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_PEERCRED", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_PEERCRED)).ToChecked();
  #endif
  #ifdef SO_PRIORITY
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_PRIORITY", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_PRIORITY)).ToChecked();
  #endif
  #ifdef SO_PROTOCOL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_PROTOCOL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_PROTOCOL)).ToChecked();
  #endif
  #ifdef SO_RCVBUF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_RCVBUF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_RCVBUF)).ToChecked();
  #endif
  #ifdef SO_RCVBUFFORCE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_RCVBUFFORCE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_RCVBUFFORCE)).ToChecked();
  #endif
  #ifdef SO_RCVLOWAT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_RCVLOWAT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_RCVLOWAT)).ToChecked();
  #endif
  #ifdef SO_SNDLOWAT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_SNDLOWAT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_SNDLOWAT)).ToChecked();
  #endif
  #ifdef SO_RCVTIMEO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_RCVTIMEO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_RCVTIMEO)).ToChecked();
  #endif
  #ifdef SO_SNDTIMEO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_SNDTIMEO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_SNDTIMEO)).ToChecked();
  #endif
  #ifdef SO_REUSEADDR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_REUSEADDR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_REUSEADDR)).ToChecked();
  #endif
  #ifdef SO_REUSEPORT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_REUSEPORT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_REUSEPORT)).ToChecked();
  #endif
  #ifdef SO_RXQ_OVFL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_RXQ_OVFL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_RXQ_OVFL)).ToChecked();
  #endif
  #ifdef SO_SNDBUF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_SNDBUF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_SNDBUF)).ToChecked();
  #endif
  #ifdef SO_SNDBUFFORCE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_SNDBUFFORCE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_SNDBUFFORCE)).ToChecked();
  #endif
  #ifdef SO_TIMESTAMP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_TIMESTAMP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_TIMESTAMP)).ToChecked();
  #endif
  #ifdef SO_TYPE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_TYPE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_TYPE)).ToChecked();
  #endif
  #ifdef SO_BUSY_POLL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "SO_BUSY_POLL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, SO_BUSY_POLL)).ToChecked();
  #endif

  // IP-Level Options -- http://man7.org/linux/man-pages/man7/ip.7.html //
  #ifdef IPPROTO_IP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPPROTO_IP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPPROTO_IP)).ToChecked();
  #endif
  #ifdef IP_ADD_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_ADD_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_ADD_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IP_ADD_SOURCE_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_ADD_SOURCE_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_ADD_SOURCE_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IP_BIND_ADDRESS_NO_PORT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_BIND_ADDRESS_NO_PORT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_BIND_ADDRESS_NO_PORT)).ToChecked();
  #endif
  #ifdef IP_BLOCK_SOURCE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_BLOCK_SOURCE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_BLOCK_SOURCE)).ToChecked();
  #endif
  #ifdef IP_DROP_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_DROP_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_DROP_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IP_DROP_SOURCE_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_DROP_SOURCE_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_DROP_SOURCE_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IP_FREEBIND
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_FREEBIND", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_FREEBIND)).ToChecked();
  #endif
  #ifdef IP_HDRINCL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_HDRINCL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_HDRINCL)).ToChecked();
  #endif
  #ifdef IP_MSFILTER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MSFILTER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MSFILTER)).ToChecked();
  #endif
  #ifdef IP_MTU
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MTU", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MTU)).ToChecked();
  #endif
  #ifdef IP_MTU_DISCOVER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MTU_DISCOVER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MTU_DISCOVER)).ToChecked();
  #endif
  #ifdef IP_MULTICAST_ALL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MULTICAST_ALL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MULTICAST_ALL)).ToChecked();
  #endif
  #ifdef IP_MULTICAST_IF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MULTICAST_IF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MULTICAST_IF)).ToChecked();
  #endif
  #ifdef IP_MULTICAST_LOOP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MULTICAST_LOOP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MULTICAST_LOOP)).ToChecked();
  #endif
  #ifdef IP_MULTICAST_TTL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_MULTICAST_TTL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_MULTICAST_TTL)).ToChecked();
  #endif
  #ifdef IP_NODEFRAG
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_NODEFRAG", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_NODEFRAG)).ToChecked();
  #endif
  #ifdef IP_OPTIONS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_OPTIONS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_OPTIONS)).ToChecked();
  #endif
  #ifdef IP_PKTINFO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_PKTINFO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_PKTINFO)).ToChecked();
  #endif
  #ifdef IP_RECVERR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RECVERR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RECVERR)).ToChecked();
  #endif
  #ifdef IP_RECVOPTS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RECVOPTS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RECVOPTS)).ToChecked();
  #endif
  #ifdef IP_RECVORIGDSTADDR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RECVORIGDSTADDR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RECVORIGDSTADDR)).ToChecked();
  #endif
  #ifdef IP_RECVTOS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RECVTOS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RECVTOS)).ToChecked();
  #endif
  #ifdef IP_RECVTTL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RECVTTL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RECVTTL)).ToChecked();
  #endif
  #ifdef IP_RETOPTS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_RETOPTS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_RETOPTS)).ToChecked();
  #endif
  #ifdef IP_ROUTER_ALERT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_ROUTER_ALERT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_ROUTER_ALERT)).ToChecked();
  #endif
  #ifdef IP_TOS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_TOS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_TOS)).ToChecked();
  #endif
  #ifdef IP_TRANSPARENT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_TRANSPARENT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_TRANSPARENT)).ToChecked();
  #endif
  #ifdef IP_TTL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_TTL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_TTL)).ToChecked();
  #endif
  #ifdef IP_UNBLOCK_SOURCE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IP_UNBLOCK_SOURCE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IP_UNBLOCK_SOURCE)).ToChecked();
  #endif

  // IPV6-Level Options -- http://man7.org/linux/man-pages/man7/ipv6.7.html //
  #ifdef IPPROTO_IPV6
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPPROTO_IPV6", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPPROTO_IPV6)).ToChecked();
  #endif
  #ifdef IPV6_ADDRFORM
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_ADDRFORM", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_ADDRFORM)).ToChecked();
  #endif
  #ifdef IPV6_ADD_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_ADD_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_ADD_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IPV6_DROP_MEMBERSHIP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_DROP_MEMBERSHIP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_DROP_MEMBERSHIP)).ToChecked();
  #endif
  #ifdef IPV6_MTU
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_MTU", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_MTU)).ToChecked();
  #endif
  #ifdef IPV6_MTU_DISCOVER
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_MTU_DISCOVER", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_MTU_DISCOVER)).ToChecked();
  #endif
  #ifdef IPV6_MULTICAST_HOPS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_MULTICAST_HOPS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_MULTICAST_HOPS)).ToChecked();
  #endif
  #ifdef IPV6_MULTICAST_IF
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_MULTICAST_IF", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_MULTICAST_IF)).ToChecked();
  #endif
  #ifdef IPV6_MULTICAST_LOOP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_MULTICAST_LOOP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_MULTICAST_LOOP)).ToChecked();
  #endif
  #ifdef IPV6_RECVPKTINFO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_RECVPKTINFO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_RECVPKTINFO)).ToChecked();
  #endif
  #ifdef IPV6_RTHDR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_RTHDR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_RTHDR)).ToChecked();
  #endif
  #ifdef IPV6_AUTHHDR
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_AUTHHDR", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_AUTHHDR)).ToChecked();
  #endif
  #ifdef IPV6_DSTOPTS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_DSTOPTS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_DSTOPTS)).ToChecked();
  #endif
  #ifdef IPV6_HOPOPTS
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_HOPOPTS", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_HOPOPTS)).ToChecked();
  #endif
  #ifdef IPV6_FLOWINFO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_FLOWINFO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_FLOWINFO)).ToChecked();
  #endif
  #ifdef IPV6_HOPLIMIT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPV6_HOPLIMIT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPV6_HOPLIMIT)).ToChecked();
  #endif

  // TCP-Level Options -- http://man7.org/linux/man-pages/man7/tcp.7.html //
  #ifdef IPPROTO_TCP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPPROTO_TCP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPPROTO_TCP)).ToChecked();
  #endif
  #ifdef TCP_CORK
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_CORK", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_CORK)).ToChecked();
  #endif
  #ifdef TCP_DEFER_ACCEPT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_DEFER_ACCEPT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_DEFER_ACCEPT)).ToChecked();
  #endif
  #ifdef TCP_INFO
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_INFO", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_INFO)).ToChecked();
  #endif
  #ifdef TCP_KEEPCNT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_KEEPCNT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_KEEPCNT)).ToChecked();
  #endif
  #ifdef TCP_KEEPIDLE
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_KEEPIDLE", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_KEEPIDLE)).ToChecked();
  #endif
  #ifdef TCP_KEEPINTVL
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_KEEPINTVL", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_KEEPINTVL)).ToChecked();
  #endif
  #ifdef TCP_LINGER2
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_LINGER2", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_LINGER2)).ToChecked();
  #endif
  #ifdef TCP_MAXSEG
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_MAXSEG", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_MAXSEG)).ToChecked();
  #endif
  #ifdef TCP_NODELAY
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_NODELAY", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_NODELAY)).ToChecked();
  #endif
  #ifdef TCP_QUICKACK
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_QUICKACK", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_QUICKACK)).ToChecked();
  #endif
  #ifdef TCP_SYNCNT
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_SYNCNT", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_SYNCNT)).ToChecked();
  #endif
  #ifdef TCP_WINDOW_CLAMP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "TCP_WINDOW_CLAMP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, TCP_WINDOW_CLAMP)).ToChecked();
  #endif

  // UDP-Level Options -- http://man7.org/linux/man-pages/man7/udp.7.html//
  #ifdef IPPROTO_UDP
    exports->Set(context, v8::String::NewFromUtf8(isolate, "IPPROTO_UDP", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, IPPROTO_UDP)).ToChecked();
  #endif
  #ifdef UDP_CORK
    exports->Set(context, v8::String::NewFromUtf8(isolate, "UDP_CORK", v8::NewStringType::kNormal).ToLocalChecked(), v8::Integer::New(isolate, UDP_CORK)).ToChecked();
  #endif

  // Methods //
  exports->Set(context, v8::String::NewFromUtf8(isolate, "socket", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Socket)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "bind", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Bind)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "connect", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Connect)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "listen", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Listen)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "accept", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Accept)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "send", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Send)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "sendto", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Sendto)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "recv", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Recv)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "recvfrom", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Recvfrom)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "close", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Close)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "shutdown", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Shutdown)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "getsockopt", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Getsockopt)->GetFunction(context).ToLocalChecked()).ToChecked();
  exports->Set(context, v8::String::NewFromUtf8(isolate, "setsockopt", v8::NewStringType::kNormal).ToLocalChecked(), v8::FunctionTemplate::New(isolate, Setsockopt)->GetFunction(context).ToLocalChecked()).ToChecked();

}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
