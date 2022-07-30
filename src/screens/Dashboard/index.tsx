import React, {
  useCallback,
  useEffect,
  useState
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLLECTION_TRANSACTIONS } from '../../config/database';

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer
} from './styles';

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard } from '../../components/TransactionCard';
import { TransactionProps } from '../../interface/TransactionProps';

export interface DataListProps extends TransactionProps {
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightTransactions {
  entries: HighlightProps;
  expensives: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightTransaction, setHighlightTransaction] = useState<HighlightTransactions>({} as HighlightTransactions);

  const theme = useTheme();
  const { signOut, user } = useAuth();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ) {
    const collectionFiltterred = collection
      .filter(transaction => transaction.type === type);

    if (collectionFiltterred.length === 0)
      return '';

    const lastTransaction = new Date(
      Math.max.apply(Math, collectionFiltterred
        .map(transaction => new Date(transaction.date).getTime())
      )
    );

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
  }

  async function loadTransactions() {
    const response = await AsyncStorage.getItem(`${COLLECTION_TRANSACTIONS}:${user.id}`);
    const transactions = response ? JSON.parse(response) : [];
    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DataListProps[] = transactions.map(
      (item: DataListProps) => {

        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date
        }
      }
    );

    setTransactions(transactionsFormatted);

    const lastTransactionsEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionsExpensives = getLastTransactionDate(transactions, 'negative');
    const totalInterval = lastTransactionsExpensives === '' ? 'Você não possuí transações...' : `01 a ${lastTransactionsExpensives}`;

    const total = entriesTotal - expensiveTotal;

    setHighlightTransaction({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsEntries === '' ? 'Você não possuí transações de entradas...' : `Última entrada dia ${lastTransactionsEntries}`
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsExpensives === '' ? 'Você não possuí transações de saídas...' : `Última saída dia ${lastTransactionsExpensives}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    });
    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));

  return (
    <Container>
      {
        isLoading ?
          <LoadContainer>
            <ActivityIndicator
              color={theme.colors.primary}
              size="large"
            />
          </LoadContainer>
          :
          <>
            <Header>
              <UserWrapper>
                <UserInfo>
                  <Photo
                    source={{ uri: user.photo }}
                  />

                  <User>
                    <UserGreeting>Olá,</UserGreeting>
                    <UserName>{user.name}</UserName>
                  </User>
                </UserInfo>

                <LogoutButton
                  onPress={signOut}
                >
                  <Icon name="power" />
                </LogoutButton>
              </UserWrapper>
            </Header>

            <HighlightCards>
              <HighlightCard
                type='up'
                title='Entradas'
                amount={highlightTransaction.entries.amount}
                lastTransaction={highlightTransaction.entries.lastTransaction}
              />
              <HighlightCard
                type='down'
                title='Saídas'
                amount={highlightTransaction.expensives.amount}
                lastTransaction={highlightTransaction.expensives.lastTransaction}
              />
              <HighlightCard
                type='total'
                title='Total'
                amount={highlightTransaction.total.amount}
                lastTransaction={highlightTransaction.total.lastTransaction}
              />
            </HighlightCards>

            <Transactions>
              <Title>Listagem</Title>

              <TransactionList
                data={transactions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <TransactionCard data={item} />}
              />
            </Transactions>
          </>
      }
    </Container>
  );
}