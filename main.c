#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_ACCOUNTS 1000
#define MAX_TRANSACTIONS 5000
#define MIN_DEPOSIT 500

typedef struct {
    int accNo;
    char name[100];
    double balance;
} Account;

typedef struct {
    int accNo;
    char type[10];
    double amount;
    char date[50];
} Transaction;

Account accounts[MAX_ACCOUNTS];
Transaction transactions[MAX_TRANSACTIONS];
int accountCount = 0;
int transactionCount = 0;

// Find account by account number
Account* findAccount(int accNo) {
    for (int i = 0; i < accountCount; i++) {
        if (accounts[i].accNo == accNo) {
            return &accounts[i];
        }
    }
    return NULL;
}

// Create new account
int createAccount(int accNo, const char* name, double balance) {
    if (accNo <= 0) return -1;
    if (balance < MIN_DEPOSIT) return -2;
    if (findAccount(accNo) != NULL) return -3;
    if (accountCount >= MAX_ACCOUNTS) return -4;

    accounts[accountCount].accNo = accNo;
    strncpy(accounts[accountCount].name, name, 99);
    accounts[accountCount].balance = balance;
    accountCount++;

    return 1;
}

// Deposit money
int deposit(int accNo, double amount) {
    Account* acc = findAccount(accNo);
    if (acc == NULL) return -1;
    if (amount <= 0) return -2;
    if (transactionCount >= MAX_TRANSACTIONS) return -3;

    acc->balance += amount;
    transactions[transactionCount].accNo = accNo;
    strncpy(transactions[transactionCount].type, "DEPOSIT", 9);
    transactions[transactionCount].amount = amount;
    transactionCount++;

    return 1;
}

// Withdraw money
int withdraw(int accNo, double amount) {
    Account* acc = findAccount(accNo);
    if (acc == NULL) return -1;
    if (amount <= 0) return -2;
    if (acc->balance < amount) return -3;
    if (transactionCount >= MAX_TRANSACTIONS) return -4;

    acc->balance -= amount;
    transactions[transactionCount].accNo = accNo;
    strncpy(transactions[transactionCount].type, "WITHDRAW", 9);
    transactions[transactionCount].amount = amount;
    transactionCount++;

    return 1;
}

// Get account balance
double getBalance(int accNo) {
    Account* acc = findAccount(accNo);
    return acc ? acc->balance : -1.0;
}

// Get total balance across all accounts
double getTotalBalance() {
    double total = 0.0;
    for (int i = 0; i < accountCount; i++) {
        total += accounts[i].balance;
    }
    return total;
}

// Get account count
int getAccountCount() {
    return accountCount;
}

// Get transaction count
int getTransactionCount() {
    return transactionCount;
}

// Get total deposits
double getTotalDeposits() {
    double total = 0.0;
    for (int i = 0; i < transactionCount; i++) {
        if (strcmp(transactions[i].type, "DEPOSIT") == 0) {
            total += transactions[i].amount;
        }
    }
    return total;
}

// Get total withdrawals
double getTotalWithdrawals() {
    double total = 0.0;
    for (int i = 0; i < transactionCount; i++) {
        if (strcmp(transactions[i].type, "WITHDRAW") == 0) {
            total += transactions[i].amount;
        }
    }
    return total;
}