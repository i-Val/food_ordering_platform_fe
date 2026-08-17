import http from 'http';

console.log('Starting verification test for running Choply API on port 3000...');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  let passed = true;

  try {
    console.log('\n--- 1. Testing GET /api/menu ---');
    const menuRes = await request('GET', '/api/menu');
    console.log('Status:', menuRes.status);
    console.log('Menu items count:', menuRes.body.length);
    if (menuRes.status !== 200 || menuRes.body.length === 0) {
      console.error('FAIL: GET /api/menu failed');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 2. Testing GET /api/restaurants ---');
    const restoRes = await request('GET', '/api/restaurants');
    console.log('Status:', restoRes.status);
    console.log('Restaurants count:', restoRes.body.length);
    if (restoRes.status !== 200 || restoRes.body.length === 0) {
      console.error('FAIL: GET /api/restaurants failed');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 3. Testing GET /api/profile without token ---');
    const profileNoToken = await request('GET', '/api/profile');
    console.log('Status:', profileNoToken.status, '(expected 401)');
    if (profileNoToken.status !== 401) {
      console.error('FAIL: GET /api/profile should return 401 when unauthenticated');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 4. Testing POST /api/auth/signup ---');
    const email = `testuser_${Date.now()}@example.com`;
    const signupRes = await request('POST', '/api/auth/signup', {
      fullName: 'Test User',
      email: email,
      password: 'password123'
    });
    console.log('Status:', signupRes.status);
    if (signupRes.status !== 201 || !signupRes.body.token) {
      console.error('FAIL: Signup failed');
      passed = false;
    } else {
      console.log('PASS. Token received.');
    }

    const token = signupRes.body?.token;

    console.log('\n--- 5. Testing POST /api/auth/login ---');
    const loginRes = await request('POST', '/api/auth/login', {
      email: email,
      password: 'password123'
    });
    console.log('Status:', loginRes.status);
    if (loginRes.status !== 200 || !loginRes.body.token) {
      console.error('FAIL: Login failed');
      passed = false;
    } else {
      console.log('PASS. Token received.');
    }

    console.log('\n--- 6. Testing GET /api/profile with token ---');
    const profileRes = await request('GET', '/api/profile', null, token);
    console.log('Status:', profileRes.status);
    console.log('Profile User:', profileRes.body.fullName);
    console.log('Orders Count:', profileRes.body.ordersCount);
    console.log('Total Spent:', profileRes.body.totalSpent);
    if (profileRes.status !== 200 || profileRes.body.email !== email) {
      console.error('FAIL: Fetch profile with token failed');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 7. Testing POST /api/orders (requires token) ---');
    const orderPayload = {
      restaurantName: 'Mama Ngozi\'s Kitchen',
      fullName: 'Test User',
      address: '123 Test St, Test City',
      phone: '08099998888',
      items: [
        { name: 'Jollof Rice + Chicken', price: 3500, quantity: 2 },
        { name: 'Chapman', price: 1200, quantity: 1 }
      ]
    };
    const orderRes = await request('POST', '/api/orders', orderPayload, token);
    console.log('Status:', orderRes.status);
    console.log('New Order Total:', orderRes.body?.total);
    if (orderRes.status !== 201 || orderRes.body?.total !== 8200) {
      console.error('FAIL: Place order failed');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 8. Testing profile update after order ---');
    const updatedProfileRes = await request('GET', '/api/profile', null, token);
    console.log('New Orders Count:', updatedProfileRes.body.ordersCount, '(expected 1)');
    console.log('New Total Spent:', updatedProfileRes.body.totalSpent, '(expected 8200)');
    if (updatedProfileRes.body.ordersCount !== 1 || updatedProfileRes.body.totalSpent !== 8200) {
      console.error('FAIL: Profile stats did not update correctly after order');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n--- 9. Testing GET /api/orders history ---');
    const ordersHistoryRes = await request('GET', '/api/orders', null, token);
    console.log('Status:', ordersHistoryRes.status);
    console.log('History count:', ordersHistoryRes.body.length);
    if (ordersHistoryRes.status !== 200 || ordersHistoryRes.body.length !== 1) {
      console.error('FAIL: GET /api/orders history failed');
      passed = false;
    } else {
      console.log('PASS');
    }

    console.log('\n=========================================');
    if (passed) {
      console.log(' ALL TESTS PASSED SUCCESSFULLY! ');
    } else {
      console.log(' SOME TESTS FAILED. PLEASE CHECK LOGS. ');
    }
    console.log('=========================================');

    process.exit(passed ? 0 : 1);

  } catch (error) {
    console.error('Error during test execution:', error);
    process.exit(1);
  }
}

runTests();
