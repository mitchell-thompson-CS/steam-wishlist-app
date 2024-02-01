import './App.css';
import Wishlist from './component/wishlist';
import { Provider } from 'react-redux';
import store from './store';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <Wishlist />
        </header>
      </div>
    </Provider>
  );
}

export default App;
