import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../providers/user_provider.dart';

class WalletHistoryScreen extends StatefulWidget {
  const WalletHistoryScreen({super.key});

  @override
  State<WalletHistoryScreen> createState() => _WalletHistoryScreenState();
}

class _WalletHistoryScreenState extends State<WalletHistoryScreen> {
  Future<List<Transaction>>? _transactionsFuture;

  @override
  void initState() {
    super.initState();
    final userProvider = context.read<UserProvider>();
    final user = userProvider.user;
    if (user != null) {
      _transactionsFuture = ApiService.getTransactions(user.id);
    } else {
      _transactionsFuture = Future.value([]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet Statement')),
      body: _transactionsFuture == null
          ? const Center(child: CircularProgressIndicator())
          : FutureBuilder<List<Transaction>>(
              future: _transactionsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                final txs = snapshot.data ?? [];
                if (txs.isEmpty) {
                  return const Center(child: Text('No transactions yet.'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: txs.length,
                  separatorBuilder: (_, _) => const Divider(),
                  itemBuilder: (context, index) {
                    final tx = txs[index];
                    final bool isCredit = tx.type == 'TOPUP' || tx.type == 'RIDE_PAYOUT';

                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: isCredit ? Colors.green[50] : Colors.red[50],
                        child: Icon(
                          isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                          color: isCredit ? Colors.green : Colors.red,
                          size: 18,
                        ),
                      ),
                      title: Text(
                        tx.description ?? tx.type,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      subtitle: Text(
                        DateFormat('MMM dd, yyyy • HH:mm').format(tx.createdAt),
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      trailing: Text(
                        '${isCredit ? "+" : "-"} GHS ${tx.amount.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isCredit ? Colors.green : Colors.red,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
