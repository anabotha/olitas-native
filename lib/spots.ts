import type { SpotLocation } from "./types";

export const DEFAULT_SPOTS: SpotLocation[] = [

  {
  name: "Costanera Comodoro",
  latitude: -45.860,       
  longitude: -67.474,       
  orientation: 95,         
  country: "Argentina",
  exposed: false,          
  swellWindow: { min: 60, max: 115 }, 
  windShelter: { min: 200, max: 320 } 
},

{
  name: "Rada Tilly",
  latitude: -45.943,       
  
  longitude: -67.556,      
  orientation: 100,         
  country: "Argentina",
  exposed: false,          
  swellWindow: { min: 55, max: 130 }, 
  windShelter: { min: 200, max: 320 } 
},

{
  name: "Km 3",
  latitude: -45.830,        
  longitude: -67.460,       
  orientation: 75,          
  country: "Argentina",
  exposed: true,           
  swellWindow: { min: 30, max: 115 }, 
},

{
  name: "Restinga Alí",
  latitude: -45.799,        
  longitude: -67.417,      
  orientation: 70,          
  country: "Argentina",
  exposed: true,            
  swellWindow: { min: 20, max: 110 }, 
},
 {
  name: "Caleta Córdova",
  latitude: -45.742,        
  longitude: -67.379,     
  orientation: 65,          
  exposed: true,         
  swellWindow: { min: 20, max: 110 },  
                                        
                                        
  windShelter: { min: 200, max: 320 }  
}
]