// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var protos_appmap_pb = require('../protos/appmap_pb.js');

function serialize_appmap_AppMap(arg) {
  if (!(arg instanceof protos_appmap_pb.AppMap)) {
    throw new Error('Expected argument of type appmap.AppMap');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_appmap_AppMap(buffer_arg) {
  return protos_appmap_pb.AppMap.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_appmap_CancelIndexResult(arg) {
  if (!(arg instanceof protos_appmap_pb.CancelIndexResult)) {
    throw new Error('Expected argument of type appmap.CancelIndexResult');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_appmap_CancelIndexResult(buffer_arg) {
  return protos_appmap_pb.CancelIndexResult.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_appmap_DependsParams(arg) {
  if (!(arg instanceof protos_appmap_pb.DependsParams)) {
    throw new Error('Expected argument of type appmap.DependsParams');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_appmap_DependsParams(buffer_arg) {
  return protos_appmap_pb.DependsParams.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_appmap_Index(arg) {
  if (!(arg instanceof protos_appmap_pb.Index)) {
    throw new Error('Expected argument of type appmap.Index');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_appmap_Index(buffer_arg) {
  return protos_appmap_pb.Index.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_appmap_IndexEvent(arg) {
  if (!(arg instanceof protos_appmap_pb.IndexEvent)) {
    throw new Error('Expected argument of type appmap.IndexEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_appmap_IndexEvent(buffer_arg) {
  return protos_appmap_pb.IndexEvent.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

var AppMapServiceService = (exports.AppMapServiceService = {
  createIndex: {
    path: '/appmap.AppMapService/createIndex',
    requestStream: false,
    responseStream: false,
    requestType: protos_appmap_pb.Index,
    responseType: protos_appmap_pb.Index,
    requestSerialize: serialize_appmap_Index,
    requestDeserialize: deserialize_appmap_Index,
    responseSerialize: serialize_appmap_Index,
    responseDeserialize: deserialize_appmap_Index,
  },
  watchIndex: {
    path: '/appmap.AppMapService/watchIndex',
    requestStream: false,
    responseStream: true,
    requestType: protos_appmap_pb.Index,
    responseType: protos_appmap_pb.IndexEvent,
    requestSerialize: serialize_appmap_Index,
    requestDeserialize: deserialize_appmap_Index,
    responseSerialize: serialize_appmap_IndexEvent,
    responseDeserialize: deserialize_appmap_IndexEvent,
  },
  depends: {
    path: '/appmap.AppMapService/depends',
    requestStream: false,
    responseStream: true,
    requestType: protos_appmap_pb.DependsParams,
    responseType: protos_appmap_pb.AppMap,
    requestSerialize: serialize_appmap_DependsParams,
    requestDeserialize: deserialize_appmap_DependsParams,
    responseSerialize: serialize_appmap_AppMap,
    responseDeserialize: deserialize_appmap_AppMap,
  },
  cancelIndex: {
    path: '/appmap.AppMapService/cancelIndex',
    requestStream: false,
    responseStream: false,
    requestType: protos_appmap_pb.Index,
    responseType: protos_appmap_pb.CancelIndexResult,
    requestSerialize: serialize_appmap_Index,
    requestDeserialize: deserialize_appmap_Index,
    responseSerialize: serialize_appmap_CancelIndexResult,
    responseDeserialize: deserialize_appmap_CancelIndexResult,
  },
});

exports.AppMapServiceClient = grpc.makeGenericClientConstructor(
  AppMapServiceService
);
