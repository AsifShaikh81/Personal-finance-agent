import Groq from "groq-sdk";
import readline from 'node:readline/promises'
const expenseDB = [] // temp db 

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
 export async function Agent () {
  
  // const chatCompletion = await getGroqChatCompletion();
  await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  // console.log(chatCompletion.choices[0]?.message?.content || "");
} 


export async function getGroqChatCompletion() {
// readline-> creating interface 
  const rl = readline.createInterface({input:process.stdin, output:process.stdout})

  const Messages = [
    {
        role:"system",
        content:`
You are Jarvis, a personal finance assistant.

Users can:
1. Add expenses
2. Calculate total expenses between dates

Use tools when needed.
`
      },
  ]     
  
  // outer loop is for continue chatting (user prompt)
while(true){
  // inner loop is for llm (Agent) 
  // process.stdout.write("\nUser: ")
  const Question = await rl.question("\nUser: ")

  if(Question==="bye"){
    
    break
  }
  Messages.push({
    role:"user",
    content:Question
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
      },

      {
        type:'function',
        function:{
          name:'addExpense',
          description:"add expense to database",
          parameters:{
            type:'object',
            properties:{
              name:{
                type:"string",
                description:"name of the expense"

              },
              amount:{
                type:"number",
                description:"amount of the expense"

              },
            }
          }
        }
      },
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

    for(const tool of toolCalls)  
      {
      const functionName = tool.function.name
      const functionArgs = tool.function.arguments
      let result = "";
      if(functionName === "ExpenseCal"){
        result = ExpenseCal(JSON.parse(functionArgs))
      }else if(functionName === "addExpense"){
         result = addExpense(JSON.parse(functionArgs))
      }
      
      Messages.push({
      role:"tool",
      content:result,
      tool_call_id:tool.id
    })
    }
    
    // console.log("==================")
    // console.log("MESSAGES:",Messages)
    // console.log(JSON.stringify(completion.choices[0].message.content, null , 2))
    
  }
}
 rl.close()
  }
 
 
Agent().catch(console.error)

 function ExpenseCal({from, to}) {
  console.log("calling expense calc tool")

  // in reality we call database here  
  const exp = expenseDB.reduce((acc,item)=>{
    return acc + item.amount
  },0)
  return `${exp} INR ` 
}

function addExpense({name,amount}){
console.log(`${name} Added to expense db at ${amount} INR`)
expenseDB.push({name,amount})
return "Added to the database "
}



// =======================Flow =====================================

/* 
1)User → Model 
--> user query to model(llm), it decide tool call karna hai ya nahi ya fir direct answer gen karn hai 
2) Model → Tool Call
--> Model decide to call tool(in our case we need tool)
3) Tool → Result
---> Tool give output ,output stored in result 
4) Result → Model
---> Result is given to model
5) Model → Final Answer
---> model(llm) finally generates answer 
*/
