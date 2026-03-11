import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
 export async function Agent () {
  
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
} 


export async function getGroqChatCompletion() {
  const Messages = [
    {
        role:"system",
        content:"you are a jarvis a personal finance assistant. your task is to calculate total expense "
      },
  ]     
  
  Messages.push({
    role:"user",
    content:"how much money i spent this month "
  })
  
  while(true){
     const  completion = await groq.chat.completions.create({
    
    messages: Messages,
    model:"llama-3.3-70b-versatile",
    tools:[
      {
        type:'function',
        function:{
          name:'ExpenseCal',
          description:"get total expense from start date to end date",
          parameters:{
            type:'object',
            properties:{
              from:{
                type:"string",
                description:"start date"

              },
              to:{
                type:"string",
                description:"end date"

              },
            }
          }
        }
      }
    ]
    
  });
    // getting tool call object --> tool_calls
    const toolCalls = completion.choices[0].message.tool_calls 
    
    // pushing assistant message to message history
    Messages.push(completion.choices[0].message)

    // note: LLM tool call karte rahega until it gets answer , so if no tool call means it got the answer. 
    //On the basis of this logic we created below check !toolCalls
    if(!toolCalls){
      console.log(`Assistant:${completion.choices[0].message.content}`)
      break
    }

    for(const tool of toolCalls)  {
      const functionName = tool.function.name
      const functionArgs = tool.function.arguments
      let result = "";
      if(functionName === "ExpenseCal"){
        result = await ExpenseCal(JSON.parse(functionArgs))
      }
      
      Messages.push({
      role:"tool",
      content:result,
      tool_call_id:tool.id
    })
    }
    
//  console.log(JSON.stringify(completion.choices[0], null , 2))
 console.log("==================")
 console.log("MESSAGES:",Messages)
 return completion

}
  }
 
 
Agent()

async function ExpenseCal({from, to}) {
  console.log("calling expense cal tool")

  // 
  return "1000 INR" 
}
