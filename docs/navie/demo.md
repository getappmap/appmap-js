---
layout: docs
title: Docs - AppMap Navie
name: Demo
step: 5
navie: true
---

# Video Demo

**In this video**

We use Navie to learn how to add a custom offline captcha to a Django powered web store.  We will generate AppMaps of our user registration process, and then ask Navie for where and how to add this feature. By using Retrieval-Augmented Generation, our answers from the Generative AI are highly specific to our codebase and how it operates allowing me to quicking find exactly where to add a new feature even while having little previous knowledge of this code base. 

{% include vimeo.html id='915670906' %}

## Follow Along

I'm here today to show you how to use the new AppMap Navie. AppMap Navie isn't just another AI code assistant, it's the missing link that improves the power of AI code completers and code assistants. Leveraging the unique ability that AppMap has to understand your code's execution at runtime, Navie transforms this data into a powerhouse of hyper-personalized context-aware insights for AI-assisted coding. That means you're not just working with static analysis anymore, and you're not looking at just individual files or functions. You're stepping into a realm where Navie can understand the entire codebase at an architectural level, how it behaves and executes, and provide much more detailed answers to your software questions.

So in this example, I'm a software engineer working on a Django-powered web store. I've been tasked with adding a captcha for the registration page here. I've got AppMap installed with my project already, which means as I interact with my registration page, it will generate AppMaps automatically for my service. You can also use tests to interact with any part of your application to generate AppMaps. You can see here navigating these AppMaps, I can see this API request all the way down to the database and all the code in between.

<img class="video-screenshot" src="/assets/img/docs/navie-demo-1.webp"/> 

So now I can use this data to ask AppMap Navie what areas of my codebase are involved in the new user registration service because I want to find the files so that I can add an offline captcha. AppMap Navie will now search through all of my AppMaps and provide the detailed runtime sequence diagrams as additional context to the generative AI. You can use the AppMap-provided GPT-4 models or bring your own API keys. I can search through my AppMap data based on my request and send this data along to the generative AI service to get a much clearer view into exactly what files I need to find and edit.

<img class="video-screenshot" src="/assets/img/docs/navie-demo-2.webp"/> 

If I was using an AI-powered code autocompleter, I would need to already know what files or functions that this request hits. I would actually need to be in the function to make this code change. AppMap sees how my code executes and Navie provides the AI with the context. I get very clear and direct insight into exactly where I need to make this code change.

<img class="video-screenshot" src="/assets/img/docs/navie-demo-3.webp"/> 

Now that Navie has summarized how this feature works and walked me through the code interactions, I'm going to ask for more specific information on how to implement this change. Let's review what it recommended. First, it's going to want me to install the Django Simple Captcha service, which we'll do here. Then we're going to add the application to our settings file. 

Next, we're going to update this line here in our urls.py file. In the next step, we need to update the registration form at forms.py. We'll go open that file here and add the first line to import the package. In the next section, we need to add the Captcha to the form, but it didn't tell us which specific function we need to add that in. Looking through this code, I'm really not sure where I need to add this, so I think it's time we ask another question.

We'll ask Navie about this specific library, giving it this additional context, and you'll see a simple example on where we can add this feature will be given back to us. Upon asking this question with more specific context, you'll notice that Navie is telling us to add this to the email user creation form.

<img class="video-screenshot" src="/assets/img/docs/navie-demo-4.webp"/> 

Now, let's go back to that file and search for that function. And now we can see right here is where we'll add the Captcha in the right location. So we've already added it to our installed apps, but we have not yet run a database migration, so I'm going to do that now. With our database migration executed, we can continue the steps and update the HTML template for the registration page, which I can search for here.

Using this registration template, we can copy the code over from Navie and paste it into this section above the submit button. Let's refresh our page now and head over to the registration portal, and you'll see this new Captcha field has been created. So let's test this out. We'll fill this form out and complete the Captcha correctly, and the user account gets created. 

<img class="video-screenshot" src="/assets/img/docs/navie-demo-5.webp"/> 

Now we'll do that one more time, but we'll register our account with an invalid Captcha. You'll see that registration has failed and the user was notified that the Captcha was incorrect.

Now you can see how AppMap improves the AI coding experience across your entire application.  If you asked asked similar questions to a standard AI assistant you would only get generic answers based on existing public knowledge. Without knowledge of your code, these generic reponses will leave you continuing to hunt and search thru a complex code base.  With AppMap able to see all of your codes runtime behavior, it can now provide context-aware insights to power these hyper-personalized responses to your software questions in your code editor.  
