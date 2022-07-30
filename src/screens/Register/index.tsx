import React, { useState } from 'react';
import { useAuth } from '../../hooks/auth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLLECTION_TRANSACTIONS } from '../../config/database'
import uuid from 'react-native-uuid';
import {
  useNavigation,
  NavigationProp,
  ParamListBase
} from '@react-navigation/native';

import { InputForm } from '../../components/Form/InputForm';
import { Button } from '../../components/Form/Button';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { CategorySelect } from '../CategorySelect'

import {
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionsTypes
} from './styles';

interface FormData {
  [name: string]: string;
  [amount: number]: any;
}

const schema = yup.object().shape({
  name: yup.string()
    .required('Nome é obrigatório'),
  amount: yup.number()
    .typeError('Informe um valor númerico')
    .positive('O valor não pode ser negativo')
    .required('O valor é obrigatório')
});

export function Register() {
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria'
  });

  const { user } = useAuth();

  const { navigate }: NavigationProp<ParamListBase> = useNavigation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  function handleTransactionTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: FormData) {

    if (!transactionType)
      return Alert.alert('Selecione o tipo da transação');

    if (category.key === 'category')
      return Alert.alert('Selecione o tipo a categoria');

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date()
    }

    try {
      const collection = await AsyncStorage.getItem(`${COLLECTION_TRANSACTIONS}:${user.id}`);
      const currentCollection = collection ? JSON.parse(collection) : [];
      const collectionFormatted = [...currentCollection, newTransaction];

      await AsyncStorage.setItem(`${COLLECTION_TRANSACTIONS}:${user.id}`, JSON.stringify(collectionFormatted));

      reset();
      setTransactionType('');
      setCategory({
        key: 'category',
        name: 'Categoria'
      });
      navigate('Listagem');
    } catch (error) {
      console.log(error);
      Alert.alert("Não foi possível salver");
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
    >
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm
              name='name'
              control={control}
              placeholder='Nome'
              autoCapitalize='sentences'
              autoCorrect={false}
              error={errors.name && errors.name.message}
            />
            <InputForm
              name='amount'
              control={control}
              placeholder='Preço'
              keyboardType='number-pad'
              error={errors.amount && errors.amount.message}
            />

            <TransactionsTypes>
              <TransactionTypeButton
                type='up'
                title='Income'
                onPress={() => handleTransactionTypeSelect('positive')}
                isActive={transactionType === 'positive'}
              />

              <TransactionTypeButton
                type='down'
                title='Outcome'
                onPress={() => handleTransactionTypeSelect('negative')}
                isActive={transactionType === 'negative'}
              />
            </TransactionsTypes>

            <CategorySelectButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>

          <Button
            title='Enviar'
            onPress={handleSubmit(handleRegister)}
          />

          <Modal visible={categoryModalOpen}>
            <CategorySelect
              category={category}
              setCategory={setCategory}
              closeSelectCategory={handleCloseSelectCategoryModal}
            />
          </Modal>

        </Form>
      </Container>
    </TouchableWithoutFeedback>
  );
}