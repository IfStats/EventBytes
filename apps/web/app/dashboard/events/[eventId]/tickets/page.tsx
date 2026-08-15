"use client";

import {
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import {
  Input,
} from "@/components/ui/input";


import {
  Button,
} from "@/components/ui/button";


import {
  useAuth,
} from "@/context/auth-context";


import {
  getTicketCategories,
  createTicketCategory,
  deleteTicketCategory,
} from "@/lib/api/ticket-categories/ticket-categories";



export default function TicketsPage(){

const params = useParams();

const eventId =
params.eventId as string;


const {
 organizationId
}=useAuth();


const queryClient =
useQueryClient();



const [form,setForm]=useState({

name:"",
price:"",
quantity:"",

});



const {
data,
isLoading,
}=useQuery({

queryKey:[
 "tickets",
 eventId
],

queryFn:()=>getTicketCategories(
 eventId
),

enabled:
!!eventId,

});





const mutation =
useMutation({

mutationFn:()=>createTicketCategory(

 organizationId!,
 eventId,

 {

  name:form.name,

  price:Number(form.price),

  quantity:Number(form.quantity),

 }

),


onSuccess:()=>{

queryClient.invalidateQueries({

queryKey:[
"tickets",
eventId
]

});


setForm({

name:"",
price:"",
quantity:""

});

}

});






const remove =
useMutation({

mutationFn:
(id:string)=>
deleteTicketCategory(id),


onSuccess:()=>{

queryClient.invalidateQueries({

queryKey:[
"tickets",
eventId
]

});

}

});







return (

<div className="p-8">


<h1 className="text-3xl font-bold mb-6">
Ticket Categories
</h1>



<Card className="mb-8">

<CardHeader>

<CardTitle>
Add Ticket Type
</CardTitle>

</CardHeader>


<CardContent className="space-y-4">


<Input
placeholder="Name"
value={form.name}
onChange={
e=>setForm({
...form,
name:e.target.value
})
}
/>


<Input
placeholder="Price"
type="number"
value={form.price}
onChange={
e=>setForm({
...form,
price:e.target.value
})
}
/>


<Input
placeholder="Quantity"
type="number"
value={form.quantity}
onChange={
e=>setForm({
...form,
quantity:e.target.value
})
}
/>


<Button
onClick={()=>mutation.mutate()}
disabled={!organizationId}
>
Add Ticket
</Button>


</CardContent>

</Card>





<Card>

<CardHeader>

<CardTitle>
Existing Tickets
</CardTitle>

</CardHeader>


<CardContent className="space-y-4">


{
isLoading
?
"Loading..."
:
data?.map((ticket:any)=>(


<div
key={ticket.id}
className="border p-4 rounded-lg flex justify-between"
>


<div>

<p className="font-bold">
{ticket.name}
</p>


<p>
${ticket.price}
</p>


<p>
Available: {ticket.quantity}
</p>


</div>



<Button

variant="destructive"

onClick={()=>remove.mutate(ticket.id)}

>
Delete
</Button>


</div>


))

}



</CardContent>

</Card>


</div>

)

}