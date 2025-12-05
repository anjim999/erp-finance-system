import express from 'express';
import requireRole from '../middleware/requireRole.js';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getJournalEntries,
  createJournalEntry,
  approveJournalEntry,
  getStatementsBalanceSheet,
  getStatementsProfitLoss,
  getStatementsCashFlow,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  getPayments,
  createPayment,
  getCustomers,
  createCustomer,
  updateCustomer,
  getVendors,
  createVendor,
  updateVendor,
  getFinanceDashboardSummary,
  getFinanceCashFlowTrend,
  getExchangeRates,
  createExchangeRate,
} from '../controllers/financeController.js';

const router = express.Router();

// all require finance_manager or admin
router.use(requireRole('finance_manager', 'admin'));

router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

router.get('/journals', getJournalEntries);
router.post('/journals', createJournalEntry);
router.post('/journals/:id/approve', approveJournalEntry);

router.get('/statements/balance-sheet', getStatementsBalanceSheet);
router.get('/statements/profit-loss', getStatementsProfitLoss);
router.get('/statements/cash-flow', getStatementsCashFlow);

router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.post('/invoices', createInvoice);
router.put('/invoices/:id', updateInvoice);

router.get('/payments', getPayments);
router.post('/payments', createPayment);

router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);

router.get('/vendors', getVendors);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);

router.get('/dashboard/summary', getFinanceDashboardSummary);
router.get('/dashboard/cash-flow-trend', getFinanceCashFlowTrend);

router.get('/exchange-rates', getExchangeRates);
router.post('/exchange-rates', createExchangeRate);

export default router;
