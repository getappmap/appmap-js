---
layout: docs
title: Docs - AppMap Navie
description: "Enhance Generative AI models with AppMap Navie. Navie leverages RAG to provide accurate answers by searching locally stored AppMap Data for relevant code snippets and application insights."
name: How Navie Works
step: 1
navie: true
---

# How Navie Works

Navie uses your existing AppMap Data to improve the accuracy and reliability of Generative AI models using Retrieval-Augmented Generation (RAG). When a question is asked to the Navie chat interface, AppMap will search through your locally stored AppMap Data to identify the most relevant maps related to your question. Then Navie will use these maps to identify the relevant code snippets related to the question.  This corpus of data becomes the context provided to the Generative AI service which includes your original question. 

This powerful technique provides the AI with many valuable pieces of information:  
1) Runtime sequence diagram information of your application  
2) Relevant source code files and snippets involved or related to your question.  
3) Granular application tracing data.  
4) Detailed insights into data flows, SQL queries, and other database interactions.  


## Navie Technical Architecture

Navie integrates seamlessly into your existing AppMap enabled project.  Once you have the AppMap software libraries installed into your project, interact with your application or run tests to automatically generate AppMap Data. All of your code and AppMap Data will stay locally in your environment until you ask Navie a question.  After asking a question to Navie, the relevant AppMap Diagrams and code snippets are located locally by the AppMap search and explain API, then this data is sent to OpenAI (available option to bring your own LLM), and the response is returned to the user. 

![Navie Architecture](/assets/img/product/navie-architecture-slide.svg)

For more details about the privacy and security of your AppMap Data, refer to the [AppMap Security FAQ](https://appmap.io/security)