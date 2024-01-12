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


const router = createBrowserRouter([
  { path:"/",
    element:<App/>
  },
  { path:"/Events",
    element:<Eventpage/>
  }
])


const root= ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RouterProvider router={router}/>
);

