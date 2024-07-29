import './App.css';
import TideCard from './TideCard.js';
import WeatherCard from './WeatherCard.js';
import FishCard from './FishCard.js';
import Header from './Header.js';
import Footer from './Footer.js';

function App() {
  return (
    <>
      <Header />
      <div className="card-container">
        <TideCard />
        <WeatherCard />
        <FishCard />
      </div>
      <Footer />
    </>
  );
}

export default App;
