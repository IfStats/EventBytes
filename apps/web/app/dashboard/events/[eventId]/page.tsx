"use client";

import {
  useParams,
  useRouter,
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
  Button,
} from "@/components/ui/button";


import {
  useAuth,
} from "@/context/auth-context";


import {
  getEvents,
  publishEvent,
} from "@/lib/api/events/events";



export default function EventDetailsPage(){


const params = useParams();

const router = useRouter();

const queryClient =
useQueryClient();


const eventId =
params.eventId as string;


const {
 organizationId
}=useAuth();

console.log(
  "EVENT PAGE PARAMS",
  params
);

console.log(
  "AUTH ORG ID",
  organizationId
);



const {
 data:events,
 isLoading,
}=useQuery({

queryKey:[
 "events",
 organizationId
],


queryFn:()=>getEvents(
 organizationId!
),


enabled:
!!organizationId

});




const event =
events?.find(
(e:any)=>e.id===eventId
);





const publishMutation =
useMutation({

mutationFn:()=>publishEvent(

 organizationId!,

 eventId

),


onSuccess:()=>{

queryClient.invalidateQueries({

queryKey:[
"events",
organizationId
]

});

}

});







if(isLoading){

return (

<div className="p-8">
Loading event...
</div>

)

}





if(!event){

return (

<div className="p-8">

Event not found

</div>

)

}







return (

<div className="p-8 space-y-6">


<div className="flex justify-between items-center">


<div>

<h1 className="text-3xl font-bold">

{event.name}

</h1>


<p className="text-muted-foreground">

{event.description}

</p>


</div>



<Button

onClick={()=>publishMutation.mutate()}

disabled={
publishMutation.isPending ||
event.published
}

>

{
event.published
?
"Published"
:
"Publish Event"
}

</Button>



</div>






<Card>


<CardHeader>

<CardTitle>
Event Information
</CardTitle>

</CardHeader>



<CardContent className="space-y-3">


<p>
<strong>Venue:</strong>{" "}
{event.venue}
</p>


<p>
<strong>Start:</strong>{" "}
{
new Date(
event.startDate
).toLocaleString()
}
</p>


<p>
<strong>End:</strong>{" "}
{
new Date(
event.endDate
).toLocaleString()
}
</p>



<p>

<strong>Status:</strong>{" "}

<span
className={
event.published
?
"text-green-600"
:
"text-yellow-600"
}
>

{
event.published
?
"PUBLISHED"
:
"DRAFT"
}

</span>


</p>



</CardContent>


</Card>





<Card>


<CardHeader>

<CardTitle>
Manage Tickets
</CardTitle>

</CardHeader>



<CardContent>


<Button

onClick={()=>router.push(

`/dashboard/events/${eventId}/tickets`

)}

>

Manage Ticket Categories

</Button>


</CardContent>


</Card>





</div>

)

}