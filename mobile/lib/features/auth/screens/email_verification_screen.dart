import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({super.key});
  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  bool _checking = false;

  Future<void> _checkVerification() async {
    setState(() => _checking = true);
    await FirebaseAuth.instance.currentUser?.reload();
    if (FirebaseAuth.instance.currentUser?.emailVerified == true) {
      if (mounted) context.go('/home');
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Email not verified yet. Check your inbox.'), backgroundColor: Colors.orange));
    }
    if (mounted) setState(() => _checking = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('📧', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 20),
                const Text('Check Your Email', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                Text('We sent a verification link to\n${FirebaseAuth.instance.currentUser?.email}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 15)),
                const SizedBox(height: 32),
                SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _checking ? null : _checkVerification, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white), child: _checking ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("I've Verified My Email"))),
                const SizedBox(height: 10),
                OutlinedButton(onPressed: () async { await FirebaseAuth.instance.currentUser?.sendEmailVerification(); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verification email resent!'))); }, child: const Text('Resend Email')),
                const SizedBox(height: 10),
                TextButton(onPressed: () async { await FirebaseAuth.instance.signOut(); if (mounted) context.go('/login'); }, child: const Text('Log out', style: TextStyle(color: Colors.grey))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
