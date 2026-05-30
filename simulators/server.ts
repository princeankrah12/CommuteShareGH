import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ==========================================
// Smile Identity API Mock
// ==========================================
app.post('/smile/v1/id_verification', (req: Request, res: Response) => {
    const { id_number } = req.body;
    
    // Simulate failure for specific ID
    if (id_number === '00000000000') {
        return res.json({
            JSONVersion: '1.0.0',
            SmileJobID: '0000000300',
            PartnerParams: req.body.partner_params,
            ResultType: 'ID Verification',
            ResultText: 'ID Number Not Found',
            ResultCode: '1012'
        });
    }

    return res.json({
        JSONVersion: '1.0.0',
        SmileJobID: `0000000301-${Date.now()}`,
        PartnerParams: req.body.partner_params,
        ResultType: 'ID Verification',
        ResultText: 'ID Number Validated',
        ResultCode: '1012',
        FullData: {
            FirstName: 'John',
            LastName: 'Doe',
            DateOfBirth: '1990-01-01'
        }
    });
});

app.post('/smile/v1/biometric_verification', (req: Request, res: Response) => {
    const { partner_params } = req.body;
    // Simulate biometric matching
    return res.json({
        JSONVersion: '1.0.0',
        SmileJobID: `0000000302-${Date.now()}`,
        PartnerParams: partner_params,
        ResultType: 'Biometric Verification',
        ResultText: 'Face Match Validated',
        ResultCode: '0810',
        ConfidenceValue: 99.9
    });
});

// ==========================================
// Paystack API Mock
// ==========================================
app.post('/paystack/transaction/initialize', (req: Request, res: Response) => {
    const { amount, email, reference } = req.body;
    const txRef = reference || `tx-${Date.now()}`;
    
    return res.json({
        status: true,
        message: 'Authorization URL created',
        data: {
            authorization_url: `http://localhost:4000/paystack/checkout/${txRef}`,
            access_code: `access_${Date.now()}`,
            reference: txRef
        }
    });
});

app.post('/paystack/simulate_webhook', async (req: Request, res: Response) => {
    const { reference, webhook_url, amount, email } = req.body;
    
    const payload = {
        event: 'charge.success',
        data: {
            id: Date.now(),
            domain: 'test',
            status: 'success',
            reference: reference,
            amount: amount || 10000,
            message: null,
            gateway_response: 'Successful',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            channel: 'card',
            currency: 'NGN',
            ip_address: '127.0.0.1',
            metadata: '',
            log: null,
            fees: null,
            fees_split: null,
            authorization: {
                authorization_code: 'AUTH_8dfhjjdt',
                bin: '408408',
                last4: '4081',
                exp_month: '12',
                exp_year: '2025',
                channel: 'card',
                card_type: 'visa DEBIT',
                bank: 'Test Bank',
                country_code: 'NG',
                brand: 'visa',
                reusable: true,
                signature: 'SIG_yUzTest'
            },
            customer: {
                id: 12345,
                first_name: 'Test',
                last_name: 'User',
                email: email || 'test@example.com',
                customer_code: 'CUS_xyz123',
                phone: null,
                metadata: null,
                risk_action: 'default'
            },
            plan: {}
        }
    };

    if (webhook_url) {
        try {
            await fetch(webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return res.json({ status: true, message: 'Webhook simulated successfully' });
        } catch (error: any) {
            return res.status(500).json({ status: false, message: 'Failed to send webhook', error: error.message });
        }
    }
    
    return res.status(400).json({ status: false, message: 'Missing webhook_url' });
});

// ==========================================
// Google Maps API Mock
// ==========================================
app.get('/maps/api/geocode/json', (req: Request, res: Response) => {
    const { address } = req.query;
    
    if (address === 'Nowhere') {
        return res.json({
            results: [],
            status: 'ZERO_RESULTS'
        });
    }

    return res.json({
        results: [
            {
                formatted_address: address || '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
                geometry: {
                    location: {
                        lat: 37.4224764,
                        lng: -122.0842499
                    }
                },
                place_id: `ChIJ_${Date.now()}`
            }
        ],
        status: 'OK'
    });
});

app.get('/maps/api/directions/json', (req: Request, res: Response) => {
    const { origin, destination } = req.query;
    
    return res.json({
        geocoded_waypoints: [
            { geocoder_status: 'OK', place_id: 'ChIJ_origin' },
            { geocoder_status: 'OK', place_id: 'ChIJ_destination' }
        ],
        routes: [
            {
                bounds: {
                    northeast: { lat: 37.4224764, lng: -122.0842499 },
                    southwest: { lat: 37.4224764, lng: -122.0842499 }
                },
                legs: [
                    {
                        distance: { text: '5.0 km', value: 5000 },
                        duration: { text: '15 mins', value: 900 },
                        end_address: destination || 'Destination',
                        start_address: origin || 'Origin',
                        steps: []
                    }
                ],
                overview_polyline: {
                    points: 'test_polyline_string'
                }
            }
        ],
        status: 'OK'
    });
});

// ==========================================
// SMS Provider API Mock
// ==========================================
app.post('/sms/send', (req: Request, res: Response) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing "to" or "message" parameter'
        });
    }

    if (to === '+10000000000') {
        return res.json({
            status: 'error',
            message: 'Invalid phone number'
        });
    }

    return res.json({
        status: 'success',
        message: 'SMS queued for delivery',
        data: {
            message_id: `msg_${Date.now()}`,
            to: to
        }
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Simulator server is running on port ${PORT}`);
});
