# Tutorial Migrasi DompetPintar ke Flutter

## Daftar Isi
1. [Arsitektur Proyek](#arsitektur-proyek)
2. [Setup Flutter](#setup-flutter)
3. [Koneksi Supabase](#koneksi-supabase)
4. [Struktur Database](#struktur-database)
5. [Fitur & Implementasi](#fitur--implementasi)
6. [Tema & Design System](#tema--design-system)

---

## Arsitektur Proyek

### Struktur Web (React) → Flutter

| React (Web)               | Flutter                          |
|---------------------------|----------------------------------|
| `src/pages/`              | `lib/screens/`                   |
| `src/components/`         | `lib/widgets/`                   |
| `src/hooks/`              | `lib/providers/` atau `lib/blocs/` |
| `src/lib/`                | `lib/utils/`                     |
| `src/integrations/supabase/` | `lib/services/supabase_service.dart` |

### Dependensi Utama Flutter

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.0.0
  flutter_riverpod: ^2.4.0  # State management
  go_router: ^13.0.0        # Routing
  intl: ^0.19.0             # Formatting tanggal & mata uang
  fl_chart: ^0.68.0         # Chart (pengganti Recharts)
  flutter_svg: ^2.0.0
  google_fonts: ^6.1.0
  shared_preferences: ^2.2.0
```

---

## Setup Flutter

### 1. Buat Proyek Baru

```bash
flutter create dompet_pintar
cd dompet_pintar
```

### 2. Inisialisasi Supabase

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );

  runApp(const DompetPintarApp());
}

final supabase = Supabase.instance.client;
```

---

## Koneksi Supabase

### Service Layer

```dart
// lib/services/supabase_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  // Auth
  Future<AuthResponse> signUp(String email, String password, String fullName) =>
    _client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': fullName},
    );

  Future<AuthResponse> signIn(String email, String password) =>
    _client.auth.signInWithPassword(email: email, password: password);

  Future<void> signOut() => _client.auth.signOut();

  User? get currentUser => _client.auth.currentUser;
}
```

---

## Struktur Database

### Tabel yang sudah ada:

#### 1. `profiles`
```dart
class Profile {
  final String id;
  final String userId;
  final String? email;
  final String? fullName;
  final String currency;
  final double? monthlyIncomeEstimate;

  Profile({...});

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
    id: json['id'],
    userId: json['user_id'],
    email: json['email'],
    fullName: json['full_name'],
    currency: json['currency'] ?? 'IDR',
    monthlyIncomeEstimate: json['monthly_income_estimate']?.toDouble(),
  );
}
```

#### 2. `categories`
```dart
class Category {
  final String id;
  final String userId;
  final String name;
  final String? icon;
  final String? color;
  final String type; // 'income' | 'expense'

  Category({...});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'],
    userId: json['user_id'],
    name: json['name'],
    icon: json['icon'],
    color: json['color'],
    type: json['type'],
  );
}
```

#### 3. `transactions`
```dart
class Transaction {
  final String id;
  final String userId;
  final String? categoryId;
  final double amount;
  final String type; // 'income' | 'expense'
  final DateTime date;
  final String? note;

  Transaction({...});

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
    id: json['id'],
    userId: json['user_id'],
    categoryId: json['category_id'],
    amount: (json['amount'] as num).toDouble(),
    type: json['type'],
    date: DateTime.parse(json['date']),
    note: json['note'],
  );
}
```

#### 4. `recurring_transactions`
```dart
class RecurringTransaction {
  final String id;
  final String userId;
  final String? categoryId;
  final double amount;
  final String type;
  final String frequency; // 'daily' | 'weekly' | 'monthly' | 'yearly'
  final DateTime startDate;
  final DateTime? endDate;
  final DateTime nextRunDate;
  final String? note;
  final bool isActive;

  RecurringTransaction({...});

  factory RecurringTransaction.fromJson(Map<String, dynamic> json) =>
    RecurringTransaction(
      id: json['id'],
      userId: json['user_id'],
      categoryId: json['category_id'],
      amount: (json['amount'] as num).toDouble(),
      type: json['type'],
      frequency: json['frequency'],
      startDate: DateTime.parse(json['start_date']),
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      nextRunDate: DateTime.parse(json['next_run_date']),
      note: json['note'],
      isActive: json['is_active'],
    );
}
```

#### 5. `budgets`
```dart
class Budget {
  final String id;
  final String userId;
  final String categoryId;
  final double amount;
  final int month;
  final int year;

  Budget({...});

  factory Budget.fromJson(Map<String, dynamic> json) => Budget(
    id: json['id'],
    userId: json['user_id'],
    categoryId: json['category_id'],
    amount: (json['amount'] as num).toDouble(),
    month: json['month'],
    year: json['year'],
  );
}
```

#### 6. `goals`
```dart
class Goal {
  final String id;
  final String userId;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final DateTime? deadline;

  Goal({...});

  factory Goal.fromJson(Map<String, dynamic> json) => Goal(
    id: json['id'],
    userId: json['user_id'],
    name: json['name'],
    targetAmount: (json['target_amount'] as num).toDouble(),
    currentAmount: (json['current_amount'] as num?)?.toDouble() ?? 0,
    deadline: json['deadline'] != null ? DateTime.parse(json['deadline']) : null,
  );
}
```

---

## Fitur & Implementasi

### 1. Autentikasi (Login/Register)

```dart
// lib/screens/login_screen.dart
class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    try {
      await supabase.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (mounted) context.go('/dashboard');
    } on AuthException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _signIn,
                child: Text(_isLoading ? 'Memuat...' : 'Masuk'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 2. Dashboard

```dart
// lib/screens/dashboard_screen.dart
class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
        future: _loadDashboardData(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const CircularProgressIndicator();
          
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Stat Cards
              _buildStatCard('Total Pemasukan', income, Colors.green),
              _buildStatCard('Total Pengeluaran', expense, Colors.red),
              _buildStatCard('Saldo', balance, Theme.of(context).primaryColor),
              
              // Cash Flow Chart (gunakan fl_chart)
              const SizedBox(height: 24),
              SizedBox(
                height: 300,
                child: LineChart(/* config */),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

### 3. Transaksi CRUD

```dart
// lib/providers/transaction_provider.dart
class TransactionProvider extends ChangeNotifier {
  List<Transaction> _transactions = [];
  
  Future<void> fetchTransactions({
    required int month,
    required int year,
  }) async {
    final startDate = DateTime(year, month, 1);
    final endDate = DateTime(year, month + 1, 0);
    
    final response = await supabase
      .from('transactions')
      .select('*, category:categories(id, name, icon, color, type)')
      .gte('date', startDate.toIso8601String().split('T')[0])
      .lte('date', endDate.toIso8601String().split('T')[0])
      .order('date', ascending: false);
    
    _transactions = (response as List)
      .map((e) => Transaction.fromJson(e))
      .toList();
    notifyListeners();
  }

  Future<void> addTransaction(Map<String, dynamic> data) async {
    await supabase.from('transactions').insert({
      'user_id': supabase.auth.currentUser!.id,
      ...data,
    });
    await fetchTransactions(month: DateTime.now().month, year: DateTime.now().year);
  }

  Future<void> deleteTransaction(String id) async {
    await supabase.from('transactions').delete().eq('id', id);
    _transactions.removeWhere((t) => t.id == id);
    notifyListeners();
  }
}
```

### 4. Transaksi Berulang

```dart
// lib/providers/recurring_transaction_provider.dart
class RecurringTransactionProvider extends ChangeNotifier {
  List<RecurringTransaction> _items = [];

  Future<void> fetch() async {
    final response = await supabase
      .from('recurring_transactions')
      .select('*, category:categories(id, name, icon, color, type)')
      .order('created_at', ascending: false);
    
    _items = (response as List)
      .map((e) => RecurringTransaction.fromJson(e))
      .toList();
    notifyListeners();
  }

  Future<void> create(Map<String, dynamic> data) async {
    await supabase.from('recurring_transactions').insert({
      'user_id': supabase.auth.currentUser!.id,
      'next_run_date': data['start_date'],
      ...data,
    });
    await fetch();
  }

  Future<void> toggleActive(String id, bool isActive) async {
    await supabase
      .from('recurring_transactions')
      .update({'is_active': isActive})
      .eq('id', id);
    await fetch();
  }
}
```

### 5. Format Mata Uang

```dart
// lib/utils/currency.dart
import 'package:intl/intl.dart';

String formatCurrency(double amount, String currency) {
  switch (currency) {
    case 'IDR':
      return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0)
        .format(amount);
    case 'USD':
      return NumberFormat.currency(locale: 'en_US', symbol: '\$').format(amount);
    case 'EUR':
      return NumberFormat.currency(locale: 'de_DE', symbol: '€').format(amount);
    default:
      return NumberFormat.currency(symbol: currency).format(amount);
  }
}
```

---

## Tema & Design System

### Konfigurasi Tema

```dart
// lib/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    textTheme: GoogleFonts.plusJakartaSansTextTheme(),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF0D9668),       // Teal - hsl(168, 80%, 35%)
      onPrimary: Colors.white,
      secondary: Color(0xFFF0F2F5),     // Soft blue-gray
      onSecondary: Color(0xFF2D3A4A),
      surface: Colors.white,
      onSurface: Color(0xFF1A2B3C),
      error: Color(0xFFDC2626),
      tertiary: Color(0xFFE8A317),      // Accent amber/gold
    ),
    scaffoldBackgroundColor: const Color(0xFFFCFDFD),
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: Colors.white,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF1A2B3C),
      elevation: 0,
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: const Color(0xFF1A2B3C),
      ),
    ),
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.dark().textTheme,
    ),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF14B88C),       // Lighter teal for dark mode
      onPrimary: Color(0xFF0F1A24),
      secondary: Color(0xFF1E2D3D),
      onSecondary: Color(0xFFE8EDF2),
      surface: Color(0xFF141F2B),
      onSurface: Color(0xFFE8EDF2),
      error: Color(0xFFEF4444),
      tertiary: Color(0xFFD4930D),
    ),
    scaffoldBackgroundColor: const Color(0xFF0F1A24),
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: const Color(0xFF141F2B),
    ),
  );

  // Custom Colors
  static const Color income = Color(0xFF22C55E);
  static const Color expense = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
}
```

### Penggunaan Tema di Main

```dart
// lib/main.dart
class DompetPintarApp extends StatelessWidget {
  const DompetPintarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'DompetPintar',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Otomatis ikut pengaturan sistem
      routerConfig: router,
    );
  }
}
```

---

## Routing

```dart
// lib/router.dart
import 'package:go_router/go_router.dart';

final router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final isLoggedIn = supabase.auth.currentUser != null;
    final isAuthRoute = state.matchedLocation == '/login' || 
                        state.matchedLocation == '/register';
    
    if (!isLoggedIn && !isAuthRoute) return '/login';
    if (isLoggedIn && isAuthRoute) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    ShellRoute(
      builder: (_, __, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/transactions', builder: (_, __) => const TransactionsScreen()),
        GoRoute(path: '/recurring', builder: (_, __) => const RecurringScreen()),
        GoRoute(path: '/categories', builder: (_, __) => const CategoriesScreen()),
        GoRoute(path: '/reports', builder: (_, __) => const ReportsScreen()),
        GoRoute(path: '/goals', builder: (_, __) => const GoalsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
  ],
);
```

---

## Catatan Penting

1. **RLS (Row Level Security)** sudah dikonfigurasi di backend - tidak perlu diubah saat migrasi ke Flutter
2. **Edge Function** `process-recurring-transactions` berjalan di server - tidak terkait dengan client Flutter
3. **Supabase Auth** bekerja sama di Flutter dan Web - user yang sama bisa login di kedua platform
4. **Gunakan `supabase_flutter`** package yang resmi untuk integrasi terbaik
5. **State Management**: Disarankan menggunakan Riverpod atau BLoC untuk production app

---

## Checklist Migrasi

- [ ] Setup proyek Flutter baru
- [ ] Install dependensi (`supabase_flutter`, `go_router`, dll)
- [ ] Konfigurasi Supabase credentials
- [ ] Buat model classes untuk semua tabel
- [ ] Implementasi autentikasi (login/register)
- [ ] Buat service layer untuk Supabase queries
- [ ] Implementasi Dashboard dengan chart
- [ ] Implementasi CRUD Transaksi
- [ ] Implementasi Transaksi Berulang
- [ ] Implementasi Kategori & Anggaran
- [ ] Implementasi Laporan
- [ ] Implementasi Target Keuangan
- [ ] Implementasi Profil
- [ ] Konfigurasi tema light/dark
- [ ] Testing menyeluruh
- [ ] Build APK/IPA untuk production
