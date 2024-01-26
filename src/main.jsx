import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Eventpage from './Pages/EventPage/Eventpage'
import './index.css'
import { 
  createBrowserRouter,
  RouterProvider,
  Route,
} from "react-router-dom"
import ContactUs from './Components/ContactUs/ContactUs.jsx'


const router = createBrowserRouter([
  { path:"/",
    element:<App/>
  },
  { path:"/Events",
    element:<Eventpage/>
  },
  {
    path: "/Contact",
    element: <ContactUs/>}
])


const root= ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RouterProvider router={router}/>
);

