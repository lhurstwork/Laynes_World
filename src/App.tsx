import './App.css'
import Dashboard from './components/Dashboard'
import { config } from './config/environment'

function App() {
  return <Dashboard useMockData={config.useMockData} />
}

export default App
