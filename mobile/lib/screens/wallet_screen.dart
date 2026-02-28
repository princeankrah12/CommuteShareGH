import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _isLoading = true;
  int _balance = 0;
  int _strikes = 0;
  
  // Mock transactions for UI demonstration
  final List<Map<String, dynamic>> _mockTransactions = [
    {
      'title': 'Shift Completed',
      'amount': 10,
      'date': 'Oct 10',
      'isPositive': true
    },
    {
      'title': 'Rider No-Show Comp',
      'amount': 50,
      'date': 'Oct 12',
      'isPositive': true
    },
    {
      'title': 'Late Cancellation Penalty',
      'amount': -150,
      'date': 'Oct 14',
      'isPositive': false
    },
    {
      'title': 'Rescue Mission Bonus',
      'amount': 50,
      'date': 'Oct 15',
      'isPositive': true
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchWalletData();
  }

  Future<void> _fetchWalletData() async {
    try {
      // Simulate network delay for premium feel
      await Future.delayed(const Duration(milliseconds: 800));
      
      final data = await ApiService.getWalletDetails();
      
      if (mounted) {
        setState(() {
          _balance = data['commutePoints'] ?? 0;
          _strikes = data['strikes'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading wallet: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _showTopUpDialog(BuildContext context) async {
    final TextEditingController amountController = TextEditingController();
    bool isDialogLoading = false;

    return showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Top Up Wallet'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('How much GHS would you like to load?'),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                autofocus: true,
                decoration: const InputDecoration(
                  prefixText: 'GH₵ ',
                  border: OutlineInputBorder(),
                  hintText: '0.00',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isDialogLoading ? null : () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isDialogLoading
                  ? null
                  : () async {
                      final amountStr = amountController.text.trim();
                      if (amountStr.isEmpty) return;
                      
                      final amount = double.tryParse(amountStr);
                      if (amount == null || amount <= 0) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a valid amount')),
                        );
                        return;
                      }

                      setDialogState(() => isDialogLoading = true);

                      try {
                        final authUrl = await ApiService.initializeTopUp(amount);
                        
                        if (!context.mounted) return;
                        Navigator.pop(context); // Close dialog

                        // Launch Paystack in browser
                        final uri = Uri.parse(authUrl);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                          
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Complete your payment in the browser. Pull to refresh your wallet once done.'),
                                duration: Duration(seconds: 8),
                              ),
                            );
                          }
                        } else {
                          throw 'Could not launch payment URL';
                        }
                      } catch (e) {
                        setDialogState(() => isDialogLoading = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: ${e.toString()}')),
                          );
                        }
                      }
                    },
              child: isDialogLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Proceed to Pay'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Commute Wallet',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      floatingActionButton: _isLoading
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showTopUpDialog(context),
              label: const Text('Top Up'),
              icon: const Icon(Icons.add_card),
              backgroundColor: const Color(0xFF1A237E),
            ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchWalletData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBalanceCard(),
                    if (_strikes > 0) ...[
                      const SizedBox(height: 20),
                      _buildStrikeWarning(),
                    ],
                    const SizedBox(height: 32),
                    const Text(
                      'Recent Activity',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildTransactionList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildBalanceCard() {
    final bool isNegative = _balance < 0;
    final Color cardColor = isNegative ? const Color(0xFFB71C1C) : const Color(0xFF1A237E);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: cardColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isNegative ? 'Commute Debt' : 'Available Points',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$_balance CP',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (isNegative) ...[
            const SizedBox(height: 16),
            const Text(
              'Your Pod access is suspended. Top up to resume.',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showTopUpDialog(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFFB71C1C),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Top up via Mobile Money (MoMo)',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStrikeWarning() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'Warning: You have $_strikes/2 Strikes. Reaching 2 strikes will permanently demote you to standard Carpool.',
              style: const TextStyle(
                color: Color(0xFFE65100), // orangeScale replacement
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _mockTransactions.length,
      itemBuilder: (context, index) {
        final tx = _mockTransactions[index];
        final bool isPositive = tx['isPositive'];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[100]!),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isPositive ? Colors.green[50] : Colors.red[50],
              child: Icon(
                isPositive ? Icons.add : Icons.remove,
                color: isPositive ? Colors.green : Colors.red,
              ),
            ),
            title: Text(
              tx['title'],
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Text(tx['date']),
            trailing: Text(
              '${isPositive ? "+" : ""}${tx['amount']} CP',
              style: TextStyle(
                color: isPositive ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        );
      },
    );
  }
}

